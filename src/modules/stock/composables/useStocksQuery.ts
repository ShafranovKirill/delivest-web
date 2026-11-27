import { computed, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuery } from '@tanstack/vue-query'
import { StockService } from '../api/stock.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'

export function useStocksQuery(allowed?: Ref<boolean>) {
  const { activeBranch } = storeToRefs(useBranchStore())
  const branchId = computed(() => activeBranch.value?.id ?? '')

  return useQuery({
    queryKey: computed(() => ['stocks', branchId.value]),
    queryFn: ({ queryKey, signal }) => StockService.getStocks(queryKey[1] as string, signal),
    enabled: computed(() => !!branchId.value && (allowed?.value ?? true)),
    staleTime: 1000 * 60 * 5,
  })
}
