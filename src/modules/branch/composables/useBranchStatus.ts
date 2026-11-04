import { createSharedComposable, useNow } from '@vueuse/core'
import type { Branch } from '../api/branch.service'
import type { WorkingHoursMap } from './useBranchSchedule'
import { isOpenAt } from '../utils/workWindow'
import { wallClock } from '../utils/zonedTime'
import { t } from '@/i18n'

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
    return isOpen(branch) ? t('branch.info.openNow') : t('branch.info.closed')
  }

  return { tick, isOpen, label }
})
