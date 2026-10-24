import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuery } from '@tanstack/vue-query'
import { StockService } from '../api/stock.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'

export function useStocksQuery() {
  const { activeBranch } = storeToRefs(useBranchStore())
  const branchId = computed(() => activeBranch.value?.id ?? '')

  return useQuery({
    queryKey: computed(() => ['stocks', branchId.value]),
    queryFn: () => StockService.getStocks(branchId.value),
    enabled: computed(() => !!branchId.value),
    staleTime: 1000 * 60 * 5,
  })
}
