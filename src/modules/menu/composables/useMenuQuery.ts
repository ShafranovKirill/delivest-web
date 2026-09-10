import { useQuery } from '@tanstack/vue-query'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { MenuService } from '../api/menu.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'

export const useMenuQuery = () => {
  const branchStore = useBranchStore()
  const { activeBranch } = storeToRefs(branchStore)

  const branchId = computed(() => activeBranch.value?.id || '')

  return useQuery({
    queryKey: computed(() => ['menu', branchId.value]),
    queryFn: () => MenuService.getMenu(branchId.value),
    enabled: computed(() => !!branchId.value),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  })
}
