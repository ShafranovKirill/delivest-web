import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuery } from '@tanstack/vue-query'
import { PromotionService } from '../api/promotion.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'

export function useRunningPromotionsQuery() {
  const { activeBranch } = storeToRefs(useBranchStore())
  const branchId = computed(() => activeBranch.value?.id ?? '')

  return useQuery({
    queryKey: computed(() => ['running-promotions', branchId.value]),
    queryFn: () => PromotionService.getRunning(branchId.value),
    enabled: computed(() => !!branchId.value),
    staleTime: 1000 * 60 * 5,
  })
}
