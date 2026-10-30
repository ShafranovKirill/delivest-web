import { computed, type Ref } from 'vue'
import type { Branch } from '../api/branch.service'
import { t } from '@/i18n'
import { isoDate } from '../utils/workWindow'

export interface DaySchedule {
  enabled: boolean
  open: string | null
  close: string | null
}

export type WorkingHoursMap = Record<string, DaySchedule>

export function useBranchSchedule(activeBranch: Ref<Branch | null>) {
  const workingHours = computed<WorkingHoursMap | null>(() => {
    const rawHours = activeBranch.value?.branch_info?.working_hours
    if (!rawHours || typeof rawHours !== 'object') return null
    return Object.keys(rawHours).length > 0 ? (rawHours as unknown as WorkingHoursMap) : null
  })

  const specialHours = computed<WorkingHoursMap | null>(() => {
    const raw = activeBranch.value?.branch_info?.special_hours
    if (!raw || typeof raw !== 'object') return null
    return Object.keys(raw).length > 0 ? (raw as unknown as WorkingHoursMap) : null
  })

  const dayKeysMap: Record<number, string> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  }

  const todaySchedule = computed<DaySchedule | null>(() => {
    const exception = specialHours.value?.[isoDate(new Date())]
    if (exception) return exception

    const hours = workingHours.value
    if (!hours) return null

    const todayIndex = new Date().getDay()
    const dayKey = dayKeysMap[todayIndex]

    if (dayKey && dayKey in hours) {
      return hours[dayKey] ?? null
    }

    return null
  })

  const isOpenNow = computed<boolean>(() => {
    if (!workingHours.value && !specialHours.value) return true

    const schedule = todaySchedule.value
    if (!schedule || !schedule.enabled) return false

    const openTime = schedule.open
    const closeTime = schedule.close

    if (!openTime || !closeTime) return true

    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    return currentTime >= openTime && currentTime <= closeTime
  })

  const closingTimeToday = computed<string>(() => {
    if (!workingHours.value && !specialHours.value) return t('branch.schedule.notSet')

    const schedule = todaySchedule.value
    if (!schedule || !schedule.enabled) {
      return t('branch.schedule.dayOff')
    }
    return schedule.close
      ? t('branch.schedule.until', { time: schedule.close })
      : t('branch.schedule.allDay')
  })

  interface FormattedScheduleItem {
    day: string
    isToday: boolean
    enabled: boolean
    open: string
    close: string
  }

  const formattedScheduleList = computed<FormattedScheduleItem[]>(() => {
    const hours = workingHours.value
    if (!hours) return []

    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    const todayKey = dayKeysMap[new Date().getDay()]

    return daysOrder.map((key) => {
      const dayData = hours[key]
      return {
        day: t(`branch.days.${key}`),
        isToday: key === todayKey,
        enabled: Boolean(dayData?.enabled),
        open: dayData?.open || '',
        close: dayData?.close || '',
      }
    })
  })

  return {
    workingHours,
    specialHours,
    todaySchedule,
    isOpenNow,
    closingTimeToday,
    formattedScheduleList,
  }
}
