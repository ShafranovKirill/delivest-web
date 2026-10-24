import type { WorkingHoursMap } from '../composables/useBranchSchedule'

export interface WorkWindow {
  open: Date
  close: Date
}

const DAY_MINUTES = 24 * 60
const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export function atMinutes(day: Date, minutes: number): Date {
  const date = new Date(day)
  date.setHours(0, 0, 0, 0)
  date.setMinutes(minutes)
  return date
}

export function addDays(day: Date, days: number): Date {
  return atMinutes(day, days * DAY_MINUTES)
}

function parseClock(value: string | null | undefined): number | null {
  const match = value?.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function workWindow(
  hours: WorkingHoursMap | null,
  day: Date,
  lastMinute = DAY_MINUTES,
): WorkWindow | null {
  if (!hours) return { open: atMinutes(day, 0), close: atMinutes(day, lastMinute) }

  const schedule = hours[dayKeys[day.getDay()]!]
  if (!schedule?.enabled) return null

  const open = parseClock(schedule.open) ?? 0
  const close = parseClock(schedule.close) ?? lastMinute
  return {
    open: atMinutes(day, open),
    close: atMinutes(day, close <= open ? close + DAY_MINUTES : close),
  }
}

export function isOpenAt(hours: WorkingHoursMap | null, at: Date): boolean {
  return [addDays(at, -1), at].some((day) => {
    const window = workWindow(hours, day)
    return !!window && at >= window.open && at < window.close
  })
}

export function nextOpening(hours: WorkingHoursMap | null, from: Date, daysAhead = 7): Date | null {
  for (let offset = 0; offset <= daysAhead; offset++) {
    const window = workWindow(hours, addDays(from, offset))
    if (window && window.open > from) return window.open
  }
  return null
}
