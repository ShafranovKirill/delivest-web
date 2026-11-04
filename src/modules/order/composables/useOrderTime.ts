import { ref, computed, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { WorkingHoursMap } from '@/modules/branch/composables/useBranchSchedule'
import { addDays, isOpenAt, workWindow } from '@/modules/branch/utils/workWindow'
import {
  addMinutes as addWallMinutes,
  clockMinutes,
  formatClock,
  fromClockMinutes,
  sameDay,
  slotValue,
  wallClock,
  type WallClock,
} from '@/modules/branch/utils/zonedTime'
import { intlLocale, t } from '@/i18n'

export type Fulfillment = 'delivery' | 'pickup' | 'dine_in'

export interface TimeSlot {
  value: string
  date: WallClock
}

export interface SlotDay {
  key: string
  label: string
  slots: TimeSlot[]
}

const STEP_MINUTES = 15
const DEFAULT_DELIVERY_MINUTES = 60
const MIN_PICKUP_MINUTES = 20
const DAYS_AHEAD = 7
const MAX_DAYS = 3
const SUGGESTION_OFFSETS = [30, 60, 120]
const LAST_SLOT_MINUTE = 24 * 60 - STEP_MINUTES

function addMinutes(date: WallClock, minutes: number): WallClock {
  return addWallMinutes(date, minutes)
}

function roundUp(date: WallClock): WallClock {
  const minutes = clockMinutes(date)
  return fromClockMinutes(Math.ceil(minutes / STEP_MINUTES) * STEP_MINUTES)
}

function formatDateTime(date: WallClock): string {
  return slotValue(date)
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

  function dayWindow(day: WallClock) {
    return workWindow(workingHours.value, day, LAST_SLOT_MINUTE, specialHours.value)
  }

  function dayLabel(day: WallClock): string {
    const today = now.value
    if (sameDay(day, today)) return t('order.timeSelect.today')
    if (sameDay(day, addDays(today, 1))) return t('order.timeSelect.tomorrow')
    return formatClock(day, intlLocale(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  const openNow = computed(
    () => !isPaused.value && isOpenAt(workingHours.value, now.value, specialHours.value),
  )

  const days = computed<SlotDay[]>(() => {
    const earliest = roundUp(addMinutes(now.value, leadMinutes.value))
    const result: SlotDay[] = []

    for (let offset = -1; offset < DAYS_AHEAD && result.length < MAX_DAYS; offset++) {
      const day = addDays(now.value, offset)
      const window = dayWindow(day)
      if (!window) continue

      const first = roundUp(addMinutes(window.open, leadMinutes.value))
      const slots: TimeSlot[] = []

      for (
        let cursor = clockMinutes(earliest) > clockMinutes(first) ? earliest : first;
        clockMinutes(cursor) <= clockMinutes(window.close);
        cursor = addMinutes(cursor, STEP_MINUTES)
      ) {
        slots.push({ value: formatDateTime(cursor), date: cursor })
      }

      if (slots[0]) result.push({ key: formatDateTime(day), label: dayLabel(slots[0].date), slots })
    }

    return result
  })

  const allSlots = computed(() => days.value.flatMap((day) => day.slots))

  const asapAvailable = computed(() => {
    const first = allSlots.value[0]
    return openNow.value && !!first && sameDay(first.date, now.value)
  })

  const asapLabel = computed(() => {
    const eta = addMinutes(now.value, leadMinutes.value)
    return t('order.timeSelect.asapEta', { time: formatTimeLabel(roundUp(eta)) })
  })

  const suggestions = computed<TimeSlot[]>(() => {
    const slots = allSlots.value
    const first = slots[0]
    if (!first) return []

    const offsets = asapAvailable.value ? SUGGESTION_OFFSETS : [0, ...SUGGESTION_OFFSETS]
    const picked: TimeSlot[] = []

    for (const offset of offsets) {
      const target = addMinutes(first.date, offset)
      const slot = slots.find((item) => clockMinutes(item.date) >= clockMinutes(target))
      if (slot && !picked.includes(slot)) picked.push(slot)
      if (picked.length === 3) break
    }

    return picked
  })

  const workingUntil = computed(() => {
    const current = now.value
    const window = dayWindow(current)
    return openNow.value && window ? formatTimeLabel(window.close) : null
  })

  function formatTimeLabel(date: WallClock): string {
    return formatClock(date, intlLocale(), { hour: '2-digit', minute: '2-digit' })
  }

  function slotLabel(slot: TimeSlot): string {
    const time = formatTimeLabel(slot.date)
    return sameDay(slot.date, now.value) ? time : `${dayLabel(slot.date)}, ${time}`
  }

  function isAvailable(value: string | null): boolean {
    if (value === null) return asapAvailable.value
    return allSlots.value.some((slot) => slot.value === value)
  }

  function fallback(): string | null {
    return asapAvailable.value ? null : (allSlots.value[0]?.value ?? null)
  }

  return {
    days,
    suggestions,
    asapAvailable,
    asapLabel,
    workingUntil,
    leadMinutes,
    slotLabel,
    formatTimeLabel,
    isAvailable,
    fallback,
  }
}
