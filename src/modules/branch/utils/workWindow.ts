import type { WorkingHoursMap } from '../composables/useBranchSchedule'
import {
  addDays as addWallDays,
  addMinutes as addWallMinutes,
  atMinutes as wallAtMinutes,
  compare,
  fromClockMinutes,
  isoDate,
  type WallClock,
} from './zonedTime'

export type SpecialHoursMap = WorkingHoursMap

export interface WorkWindow {
  open: WallClock
  close: WallClock
}

const DAY_MINUTES = 24 * 60
const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export const atMinutes = wallAtMinutes
export const addDays = addWallDays

function parseClock(value: string | null | undefined): number | null {
  const match = value?.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function workWindow(
  hours: WorkingHoursMap | null,
  day: WallClock,
  lastMinute = DAY_MINUTES,
  special: SpecialHoursMap | null = null,
): WorkWindow | null {
  const exception = special?.[isoDate(day)]
  if (!hours && !exception) {
    return { open: atMinutes(day, 0), close: atMinutes(day, lastMinute) }
  }

  const schedule = exception ?? hours?.[dayKeys[day.weekday]!]
  if (!schedule?.enabled) return null

  const open = parseClock(schedule.open) ?? 0
  const close = parseClock(schedule.close) ?? lastMinute
  return {
    open: atMinutes(day, open),
    close: atMinutes(day, close <= open ? close + DAY_MINUTES : close),
  }
}

export function isOpenAt(
  hours: WorkingHoursMap | null,
  at: WallClock,
  special: SpecialHoursMap | null = null,
): boolean {
  return [addDays(at, -1), at].some((day) => {
    const window = workWindow(hours, day, DAY_MINUTES, special)
    return !!window && compare(at, window.open) >= 0 && compare(at, window.close) < 0
  })
}

export function nextOpening(
  hours: WorkingHoursMap | null,
  from: WallClock,
  daysAhead = 7,
  special: SpecialHoursMap | null = null,
): WallClock | null {
  for (let offset = 0; offset <= daysAhead; offset++) {
    const window = workWindow(hours, addDays(from, offset), DAY_MINUTES, special)
    if (window && compare(window.open, from) > 0) return window.open
  }
  return null
}

export { addWallMinutes as addMinutes, compare, fromClockMinutes }
