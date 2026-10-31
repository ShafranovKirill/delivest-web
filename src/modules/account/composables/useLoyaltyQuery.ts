import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { AccountService } from '../api/account.service'

export const LOYALTY_KEY = 'loyalty'

export const useLoyaltyQuery = () => {
  const authStore = useAuthStore()
  const branchStore = useBranchStore()
  const branchId = computed(() => branchStore.activeBranch?.id)

  return useQuery({
    queryKey: [LOYALTY_KEY, branchId, computed(() => authStore.client?.id)],
    queryFn: () => AccountService.getLoyalty(branchId.value!),
    enabled: computed(
      () =>
        authStore.isAuthenticated &&
        !!branchId.value &&
        !!branchStore.activeBranch?.branch_info?.loyalty?.enabled,
    ),
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
  })
}
