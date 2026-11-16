import { useQuery } from '@tanstack/vue-query'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { MenuService } from '../api/menu.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { i18n } from '@/i18n'

export const useMenuQuery = () => {
  const branchStore = useBranchStore()
  const { activeBranch } = storeToRefs(branchStore)

  const branchId = computed(() => activeBranch.value?.id || '')

  return useQuery({
    queryKey: computed(() => ['menu', branchId.value, i18n.global.locale.value]),
    queryFn: () => MenuService.getMenu(branchId.value),
    enabled: computed(() => !!branchId.value),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  })
}
