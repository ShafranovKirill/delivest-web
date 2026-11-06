import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { identityQueryKey, ACTIVE_ORDERS_KEY } from '@/modules/auth/private-query-cache'
import { OrderService } from '../api/order.service'

export { ACTIVE_ORDERS_KEY }

export const useActiveOrdersQuery = () => {
  const authStore = useAuthStore()

  return useQuery({
    queryKey: computed(() => identityQueryKey(ACTIVE_ORDERS_KEY, authStore.client?.id)),
    queryFn: ({ signal }) => OrderService.getActiveOrders(signal),
    staleTime: Infinity,
  })
}
