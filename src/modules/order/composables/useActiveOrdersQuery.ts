import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { identityQueryKey, ACTIVE_ORDERS_KEY } from '@/modules/auth/private-query-cache'
import { OrderService } from '../api/order.service'
import { pendingPrivateSession } from '@/api/storefront'
import { useBranchStore } from '@/modules/branch/stores/branch.store'

export { ACTIVE_ORDERS_KEY }

export const useActiveOrdersQuery = () => {
  const authStore = useAuthStore()
  const branchStore = useBranchStore()

  return useQuery({
    queryKey: computed(() => identityQueryKey(ACTIVE_ORDERS_KEY, authStore.client?.id)),
    queryFn: async ({ signal }) => {
      const pending = pendingPrivateSession(branchStore.activeBranch?.id ?? '', authStore.sessionEpoch)
      if (pending) {
        try { return (await pending).active_orders } catch { /* Legacy endpoint recovers failed bootstrap. */ }
      }
      return OrderService.getActiveOrders(signal)
    },
    staleTime: Infinity,
  })
}
