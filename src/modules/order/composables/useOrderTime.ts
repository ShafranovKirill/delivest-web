import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { DaySchedule } from '@/modules/branch/composables/useBranchSchedule'
import { intlLocale, t } from '@/i18n'

export type Fulfillment = 'delivery' | 'pickup' | 'dine_in'

export interface TimeSlot {
  value: string
  date: Date
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

const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function formatDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

function parseClock(value: string | null | undefined): number | null {
  const match = value?.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function atMinutes(day: Date, minutes: number): Date {
  const date = new Date(day)
  date.setHours(0, 0, 0, 0)
  date.setMinutes(minutes)
  return date
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

function roundUp(date: Date): Date {
  const step = STEP_MINUTES * 60_000
  return new Date(Math.ceil(date.getTime() / step) * step)
}

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

export function useOrderTime(fulfillment: Ref<Fulfillment>) {
  const branchStore = useBranchStore()
  const now = ref(new Date())
  let timer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    timer = setInterval(() => (now.value = new Date()), 30_000)
  })
  onUnmounted(() => clearInterval(timer))

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
    return hours as unknown as Record<string, DaySchedule>
  })

  function workWindow(day: Date): { open: Date; close: Date } | null {
    const hours = workingHours.value
    if (!hours) return { open: atMinutes(day, 0), close: atMinutes(day, 24 * 60 - STEP_MINUTES) }

    const schedule = hours[dayKeys[day.getDay()]!]
    if (!schedule?.enabled) return null

    const open = parseClock(schedule.open) ?? 0
    const close = parseClock(schedule.close) ?? 24 * 60 - STEP_MINUTES
    return {
      open: atMinutes(day, open),
      close: atMinutes(day, close <= open ? close + 24 * 60 : close),
    }
  }

  function dayLabel(day: Date): string {
    const today = now.value
    if (sameDay(day, today)) return t('order.timeSelect.today')
    if (sameDay(day, addMinutes(atMinutes(today, 0), 24 * 60)))
      return t('order.timeSelect.tomorrow')
    return day.toLocaleDateString(intlLocale(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  const openNow = computed(() => {
    const current = now.value
    const yesterday = addMinutes(atMinutes(current, 0), -24 * 60)
    return [yesterday, current].some((day) => {
      const window = workWindow(day)
      return !!window && current >= window.open && current < window.close
    })
  })

  const days = computed<SlotDay[]>(() => {
    const earliest = roundUp(addMinutes(now.value, leadMinutes.value))
    const result: SlotDay[] = []

    for (let offset = -1; offset < DAYS_AHEAD && result.length < MAX_DAYS; offset++) {
      const day = addMinutes(atMinutes(now.value, 0), offset * 24 * 60)
      const window = workWindow(day)
      if (!window) continue

      const first = roundUp(addMinutes(window.open, leadMinutes.value))
      const slots: TimeSlot[] = []

      for (
        let cursor = earliest > first ? earliest : first;
        cursor <= window.close;
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
      const slot = slots.find((item) => item.date >= target)
      if (slot && !picked.includes(slot)) picked.push(slot)
      if (picked.length === 3) break
    }

    return picked
  })

  const workingUntil = computed(() => {
    const current = now.value
    const window = workWindow(current)
    return openNow.value && window ? formatTimeLabel(window.close) : null
  })

  function formatTimeLabel(date: Date): string {
    return date.toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' })
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
