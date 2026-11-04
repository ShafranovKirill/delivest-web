import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useBranchStore } from '../stores/branch.store'
import { useBranchSchedule } from './useBranchSchedule'
import { addDays, isOpenAt, nextOpening, workWindow } from '../utils/workWindow'
import { compare } from '../utils/zonedTime'

export function useBranchOpening() {
  const { activeBranch } = storeToRefs(useBranchStore())
  const { workingHours, specialHours, isPaused, now } = useBranchSchedule(activeBranch)

  const isOpen = computed(
    () => !isPaused.value && isOpenAt(workingHours.value, now.value, specialHours.value),
  )
  const opensAt = computed(() =>
    isOpen.value || isPaused.value
      ? null
      : nextOpening(workingHours.value, now.value, 7, specialHours.value),
  )

  const closesAt = computed(() => {
    if (!isOpen.value) return null
    for (const day of [addDays(now.value, -1), now.value]) {
      const window = workWindow(workingHours.value, day, 24 * 60, specialHours.value)

      if (window && compare(now.value, window.open) >= 0 && compare(now.value, window.close) < 0) {
        return window.close
      }
    }
    return null
  })

  return { isOpen, isPaused, opensAt, closesAt, now }
}
