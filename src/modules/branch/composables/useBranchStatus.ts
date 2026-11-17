import { createSharedComposable, useNow } from '@vueuse/core'
import type { Branch } from '../api/branch.service'
import type { WorkingHoursMap } from './useBranchSchedule'
import { isOpenAt } from '../utils/workWindow'
import { isoDate, wallClock, weekdayKey } from '../utils/zonedTime'
import { t } from '@/i18n'

export type TodayHours =
  | { kind: 'notSet' | 'dayOff' | 'allDay' }
  | { kind: 'range' | 'overnight'; open: string; close: string }

/** Resolve today's schedule in the branch timezone, with date exceptions first. */
export function todayHours(branch: Branch, at: Date): TodayHours {
  const info = branch.branch_info
  if (!info) return { kind: 'notSet' }

  const now = wallClock(info.timezone, at)
  const special = info.special_hours as WorkingHoursMap | null
  const weekly = info.working_hours as WorkingHoursMap | null
  const dayKey = weekdayKey(now)
  const schedule = special?.[isoDate(now)] ?? (dayKey ? weekly?.[dayKey] : undefined)
  if (!schedule) return { kind: 'notSet' }
  if (!schedule.enabled) return { kind: 'dayOff' }
  if (!schedule.open && !schedule.close) return { kind: 'allDay' }

  const open = schedule.open?.slice(0, 5) || '00:00'
  const close = schedule.close?.slice(0, 5) || '24:00'
  const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))
  return { kind: minutes(close) <= minutes(open) ? 'overnight' : 'range', open, close }
}

/**
 * The same status calculation as the storefront: the branch's own timezone,
 * weekly and special hours, and the manual intake pause. Every row reads a
 * single shared clock so a long list does not create one timer per branch.
 */
export const useBranchStatus = createSharedComposable(() => {
  const tick = useNow({ interval: 30_000 })

  function isOpen(branch: Branch): boolean {
    const info = branch.branch_info
    if (!info) return false
    if (info.intake?.mode === 'paused') return false

    const hours =
      info.working_hours && Object.keys(info.working_hours).length > 0
        ? (info.working_hours as unknown as WorkingHoursMap)
        : null
    const special =
      info.special_hours && Object.keys(info.special_hours).length > 0
        ? (info.special_hours as unknown as WorkingHoursMap)
        : null

    return isOpenAt(hours, wallClock(info.timezone, tick.value), special)
  }

  function label(branch: Branch): string {
    if (branch.branch_info?.intake?.mode === 'paused') return t('branch.closed.noOpening')
    return isOpen(branch) ? t('branch.info.openNow') : t('branch.info.closed')
  }

  function hoursLabel(branch: Branch): string {
    const hours = todayHours(branch, tick.value)
    if (hours.kind === 'notSet') return t('branch.select.hours.notSet')
    if (hours.kind === 'dayOff') return t('branch.select.hours.dayOff')
    if (hours.kind === 'allDay') return t('branch.select.hours.allDay')
    if (hours.kind === 'overnight') return t('branch.select.hours.overnight', hours)
    return t('branch.select.hours.today', hours)
  }

  return { tick, isOpen, label, hoursLabel }
})
