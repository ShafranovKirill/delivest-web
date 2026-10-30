import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useNow } from '@vueuse/core'
import { useBranchStore } from '../stores/branch.store'
import { useBranchSchedule } from './useBranchSchedule'
import { isOpenAt, nextOpening } from '../utils/workWindow'

export function useBranchOpening() {
  const { activeBranch } = storeToRefs(useBranchStore())
  const { workingHours, specialHours } = useBranchSchedule(activeBranch)
  const now = useNow({ interval: 60_000 })

  const isOpen = computed(() => isOpenAt(workingHours.value, now.value, specialHours.value))
  const opensAt = computed(() => (isOpen.value ? null : nextOpening(workingHours.value, now.value, 7, specialHours.value)))

  return { isOpen, opensAt, now }
}
