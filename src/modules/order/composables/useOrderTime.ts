// src/modules/order/composables/useOrderTime.ts
import { ref, computed, type Ref } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { DaySchedule } from '@/modules/branch/composables/useBranchSchedule'

export function useOrderTime(modelValue: Ref<string | null> | string | null) {
  const branchStore = useBranchStore()
  const isCustomTimeDialogOpen = ref(false)
  const selectedPreset = ref<string>('asap')
  const selectedCustomTimes = ref<string[]>([])

  void modelValue

  const dayKeysMap: Record<number, string> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  }

  function pad(value: number) {
    return String(value).padStart(2, '0')
  }

  function formatDateTime(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  }

  function formatTimeLabel(date: Date): string {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getTodayWorkingHours(): DaySchedule | null {
    const workingHours = branchStore.activeBranch?.branch_info?.working_hours
    const todayKey = dayKeysMap[new Date().getDay()]

    if (
      !workingHours ||
      typeof workingHours !== 'object' ||
      !todayKey ||
      !(todayKey in workingHours)
    ) {
      return null
    }

    const schedule = (workingHours as Record<string, DaySchedule>)[todayKey]
    return schedule || null
  }

  function getWorkdayEnd(date: Date): Date {
    const schedule = getTodayWorkingHours()

    if (schedule?.enabled && schedule.close) {
      const parts = schedule.close.split(':').map(Number)
      const hours = parts[0]
      const minutes = parts[1]

      const endDate = new Date(date)
      // Безопасная проверка, что числа распарсились корректно
      if (
        typeof hours === 'number' &&
        !isNaN(hours) &&
        typeof minutes === 'number' &&
        !isNaN(minutes)
      ) {
        endDate.setHours(hours, minutes, 0, 0)
        return endDate
      }
    }

    const endDate = new Date(date)
    endDate.setHours(23, 59, 0, 0)
    return endDate
  }

  function getWorkdayStart(date: Date): Date {
    const schedule = getTodayWorkingHours()

    if (schedule?.enabled && schedule.open) {
      const parts = schedule.open.split(':').map(Number)
      const hours = parts[0]
      const minutes = parts[1]

      const startDate = new Date(date)
      if (
        typeof hours === 'number' &&
        !isNaN(hours) &&
        typeof minutes === 'number' &&
        !isNaN(minutes)
      ) {
        startDate.setHours(hours, minutes, 0, 0)
        return startDate
      }
    }

    return new Date(date)
  }

  function getMinimumDeliveryMinutes(): number {
    const deliveryMinutes = branchStore.activeBranch?.branch_info?.delivery_time
    if (
      typeof deliveryMinutes === 'number' &&
      Number.isFinite(deliveryMinutes) &&
      deliveryMinutes > 0
    ) {
      return deliveryMinutes
    }
    return 90
  }

  function roundUpToQuarter(date: Date): Date {
    const value = new Date(date)
    const roundedMinutes = Math.ceil(value.getMinutes() / 15) * 15
    value.setMinutes(roundedMinutes, 0, 0)

    if (value.getTime() <= date.getTime()) {
      value.setMinutes(value.getMinutes() + 15, 0, 0)
    }

    return value
  }

  function getMinimumAvailableDate(now = new Date()): Date {
    const deliveryDeadline = new Date(now.getTime() + getMinimumDeliveryMinutes() * 60 * 1000)
    const workdayStart = getWorkdayStart(now)
    return new Date(Math.max(deliveryDeadline.getTime(), workdayStart.getTime()))
  }

  const plusThreeTime = computed(() => {
    const now = new Date()
    const candidate = new Date(now.getTime() + 3 * 60 * 60 * 1000)
    const minimumAvailable = getMinimumAvailableDate(now)
    return roundUpToQuarter(new Date(Math.max(candidate.getTime(), minimumAvailable.getTime())))
  })

  const plusFourTime = computed(() => {
    const now = new Date()
    const candidate = new Date(now.getTime() + 4 * 60 * 60 * 1000)
    const minimumAvailable = getMinimumAvailableDate(now)
    return roundUpToQuarter(new Date(Math.max(candidate.getTime(), minimumAvailable.getTime())))
  })

  const customTimeOptions = computed(() => {
    const now = new Date()
    const workdayStart = getWorkdayStart(now)
    const workdayEnd = getWorkdayEnd(now)
    const minimumAvailable = getMinimumAvailableDate(now)
    const start = roundUpToQuarter(
      new Date(Math.max(minimumAvailable.getTime(), workdayStart.getTime())),
    )

    const slots: string[] = []

    for (
      let cursor = new Date(start);
      cursor <= workdayEnd;
      cursor = new Date(cursor.getTime() + 15 * 60 * 1000)
    ) {
      slots.push(formatDateTime(cursor))
    }

    return slots
  })

  const customPresetOptions = computed(() =>
    selectedCustomTimes.value.map((slot) => ({
      id: slot,
      label: formatTimeLabel(new Date(slot)),
      value: slot,
      active: selectedPreset.value === slot,
    })),
  )

  const presetOptions = computed(() => [
    {
      id: 'asap',
      label: 'Побыстрее',
      value: null,
      active: selectedPreset.value === 'asap',
    },
    {
      id: 'plus3',
      label: formatTimeLabel(plusThreeTime.value),
      value: formatDateTime(plusThreeTime.value),
      active: selectedPreset.value === 'plus3',
    },
    {
      id: 'plus4',
      label: formatTimeLabel(plusFourTime.value),
      value: formatDateTime(plusFourTime.value),
      active: selectedPreset.value === 'plus4',
    },
    ...customPresetOptions.value,
    {
      id: 'custom',
      label: 'Другое время',
      value: null,
      active: selectedPreset.value === 'custom',
    },
  ])

  return {
    isCustomTimeDialogOpen,
    selectedPreset,
    selectedCustomTimes,
    presetOptions,
    customTimeOptions,
    formatTimeLabel,
  }
}
