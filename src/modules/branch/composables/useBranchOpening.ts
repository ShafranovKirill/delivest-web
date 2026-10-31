import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useNow } from '@vueuse/core'
import { useBranchStore } from '../stores/branch.store'
import { useBranchSchedule } from './useBranchSchedule'
import { addDays, isOpenAt, nextOpening, workWindow } from '../utils/workWindow'

export function useBranchOpening() {
  const { activeBranch } = storeToRefs(useBranchStore())
  const { workingHours, specialHours } = useBranchSchedule(activeBranch)
  const now = useNow({ interval: 60_000 })

  const isOpen = computed(() => isOpenAt(workingHours.value, now.value, specialHours.value))
  const opensAt = computed(() =>
    isOpen.value ? null : nextOpening(workingHours.value, now.value, 7, specialHours.value),
  )

  const closesAt = computed(() => {
    if (!isOpen.value) return null
    for (const day of [addDays(now.value, -1), now.value]) {
      const window = workWindow(workingHours.value, day, 24 * 60, specialHours.value)
      if (window && now.value >= window.open && now.value < window.close) return window.close
    }
    return null
  })

  return { isOpen, opensAt, closesAt, now }
}
