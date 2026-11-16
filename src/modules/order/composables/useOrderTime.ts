import { ref, computed, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { WorkingHoursMap } from '@/modules/branch/composables/useBranchSchedule'
import { addDays, isOpenAt, workWindow } from '@/modules/branch/utils/workWindow'
import {
  atMinutes,
  clockMinutes,
  formatClock,
  fromClockMinutes,
  isoDate,
  wallClock,
  type WallClock,
} from '@/modules/branch/utils/zonedTime'
import { intlLocale, t } from '@/i18n'

export type Fulfillment = 'delivery' | 'pickup' | 'dine_in'

export interface TimeRange {
  start: string
  end: string
}

export interface SlotDay {
  key: string
  label: string
  ranges: TimeRange[]
  suggestions: string[]
}

const DEFAULT_DELIVERY_MINUTES = 60
const MIN_PICKUP_MINUTES = 20
const DAY_MINUTES = 24 * 60

function time(clock: WallClock): string {
  return `${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`
}

function minuteCeiling(clock: WallClock): number {
  return clockMinutes(clock) + (clock.second > 0 ? 1 : 0)
}

export function useOrderTime(fulfillment: Ref<Fulfillment>) {
  const branchStore = useBranchStore()
  const timezone = computed(() => branchStore.activeBranch?.branch_info?.timezone ?? null)
  const now = ref<WallClock>(wallClock(timezone.value))
  let timer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    timer = setInterval(() => (now.value = wallClock(timezone.value)), 30_000)
  })
  onUnmounted(() => clearInterval(timer))
  watch(timezone, (zone) => (now.value = wallClock(zone)))

  const deliveryMinutes = computed(() => {
    const minutes = branchStore.activeBranch?.branch_info?.delivery_time
    return typeof minutes === 'number' && minutes > 0 ? minutes : DEFAULT_DELIVERY_MINUTES
  })

  const leadMinutes = computed(() =>
    fulfillment.value === 'delivery'
      ? deliveryMinutes.value
      : Math.max(MIN_PICKUP_MINUTES, Math.round(deliveryMinutes.value / 2)),
  )

  const workingHours = computed(() => {
    const hours = branchStore.activeBranch?.branch_info?.working_hours
    if (!hours || typeof hours !== 'object' || Object.keys(hours).length === 0) return null
    return hours as unknown as WorkingHoursMap
  })

  const specialHours = computed(() => {
    const hours = branchStore.activeBranch?.branch_info?.special_hours
    if (!hours || typeof hours !== 'object' || Object.keys(hours).length === 0) return null
    return hours as unknown as WorkingHoursMap
  })

  const isPaused = computed(() => branchStore.activeBranch?.branch_info?.intake?.mode === 'paused')

  function dayLabel(day: WallClock, offset: number): string {
    if (offset === 0) return t('order.timeSelect.today')
    if (offset === 1) return t('order.timeSelect.tomorrow')
    if (offset === 2) return t('order.timeSelect.dayAfterTomorrow')
    return formatClock(day, intlLocale(), { weekday: 'short', day: 'numeric', month: 'short' })
  }

  // Each entry is a half-open interval of branch-local, whole-minute timestamps.
  const intervals = computed(() => {
    if (isPaused.value) return []
    const earliest = minuteCeiling(now.value) + leadMinutes.value
    if (!workingHours.value && !specialHours.value) {
      return [{ start: earliest, end: clockMinutes(atMinutes(addDays(now.value, 3), 0)) }]
    }
    const result: Array<{ start: number; end: number }> = []

    // Yesterday may still be open after midnight; the third day may contain
    // hours carried over from the previous night.
    for (let offset = -1; offset <= 2; offset++) {
      const day = addDays(now.value, offset)
      const window = workWindow(workingHours.value, day, DAY_MINUTES, specialHours.value)
      if (!window) continue
      // A default 24/7 day is a continuation, not a fresh opening.
      const opensToday = workingHours.value || specialHours.value?.[isoDate(day)]
      const start = Math.max(
        earliest,
        clockMinutes(window.open) + (opensToday ? leadMinutes.value : 0),
      )
      const end = clockMinutes(window.close)
      if (start < end) result.push({ start, end })
    }
    return result
  })

  const days = computed<SlotDay[]>(() => {
    return [0, 1, 2].map((offset) => {
      const day = addDays(now.value, offset)
      const dayStart = clockMinutes(atMinutes(day, 0))
      const dayEnd = dayStart + DAY_MINUTES
      const merged: Array<{ start: number; end: number }> = []

      for (const interval of intervals.value) {
        const start = Math.max(interval.start, dayStart)
        const end = Math.min(interval.end, dayEnd)
        if (start >= end) continue
        const previous = merged[merged.length - 1]
        if (previous && start <= previous.end) previous.end = Math.max(previous.end, end)
        else merged.push({ start, end })
      }

      const ranges = merged.map(({ start, end }) => ({
        start: time(fromClockMinutes(start)),
        end: time(fromClockMinutes(end - 1)),
      }))
      const suggestions: string[] = []
      const first = merged[0]?.start
      if (first !== undefined) {
        suggestions.push(time(fromClockMinutes(first)))
        let target = Math.ceil((first + 1) / 15) * 15
        while (suggestions.length < 3) {
          const choice = merged.find((range) => range.end > target)
          if (!choice) break
          const selected = Math.max(target, Math.ceil(choice.start / 15) * 15)
          if (selected >= choice.end) {
            target = choice.end
            continue
          }
          suggestions.push(time(fromClockMinutes(selected)))
          target = selected + 15
        }
      }
      return { key: isoDate(day), label: dayLabel(day, offset), ranges, suggestions }
    })
  })

  const openNow = computed(
    () => !isPaused.value && isOpenAt(workingHours.value, now.value, specialHours.value),
  )
  const etaMinute = computed(() => minuteCeiling(now.value) + leadMinutes.value)
  const asapAvailable = computed(
    () =>
      openNow.value &&
      intervals.value.some(({ start, end }) => start <= etaMinute.value && etaMinute.value < end),
  )
  const asapLabel = computed(() =>
    t('order.timeSelect.asapEta', { time: time(fromClockMinutes(etaMinute.value)) }),
  )

  function isAvailable(value: string | null): boolean {
    if (value === null) return asapAvailable.value
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):00$/.exec(value)
    if (!match) return false
    if (Number(match[2]) > 23 || Number(match[3]) > 59) return false
    const day = days.value.find((item) => item.key === match[1])
    if (!day) return false
    const selected = `${match[2]}:${match[3]}`
    return day.ranges.some((range) => selected >= range.start && selected <= range.end)
  }

  function fallback(): string | null {
    if (asapAvailable.value) return null
    const day = days.value.find((item) => item.ranges.length > 0)
    if (!day) return null
    return `${day.key}T${day.ranges[0]!.start}:00`
  }

  function selectedLabel(value: string): string {
    if (!isAvailable(value)) return t('order.timeSelect.pick')
    const day = days.value.find((item) => value.startsWith(`${item.key}T`))!
    return `${day.label}, ${value.slice(11, 16)}`
  }

  return { days, asapAvailable, asapLabel, leadMinutes, isAvailable, fallback, selectedLabel }
}
