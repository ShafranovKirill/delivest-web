import { computed, type Ref } from 'vue'
import type { Branch } from '../api/branch.service'

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
    const hours = workingHours.value
    if (!hours) return true

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
    const hours = workingHours.value
    if (!hours) return 'Расписание не указано'

    const schedule = todaySchedule.value
    if (!schedule || !schedule.enabled) {
      return 'Выходной'
    }
    return schedule.close ? `до ${schedule.close}` : 'Круглосуточно / Без точного времени'
  })

  interface FormattedScheduleItem {
    day: string
    enabled: boolean
    open: string
    close: string
  }

  const formattedScheduleList = computed<FormattedScheduleItem[]>(() => {
    const hours = workingHours.value
    if (!hours) return []

    const daysOrder: Array<{ key: string; label: string }> = [
      { key: 'monday', label: 'Понедельник' },
      { key: 'tuesday', label: 'Вторник' },
      { key: 'wednesday', label: 'Среда' },
      { key: 'thursday', label: 'Четверг' },
      { key: 'friday', label: 'Пятница' },
      { key: 'saturday', label: 'Суббота' },
      { key: 'sunday', label: 'Воскресенье' },
    ]

    return daysOrder.map((item) => {
      const dayData = hours[item.key]
      return {
        day: item.label,
        enabled: Boolean(dayData?.enabled),
        open: dayData?.open || '',
        close: dayData?.close || '',
      }
    })
  })

  return {
    workingHours,
    todaySchedule,
    isOpenNow,
    closingTimeToday,
    formattedScheduleList,
  }
}
