import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { identityQueryKey, MY_ORDERS_KEY } from '@/modules/auth/private-query-cache'
import { AccountService } from '../api/account.service'

export { MY_ORDERS_KEY }

export const useMyOrdersQuery = () => {
  const authStore = useAuthStore()

  return useQuery({
    queryKey: computed(() => identityQueryKey(MY_ORDERS_KEY, authStore.client?.id)),
    queryFn: ({ signal }) => AccountService.getOrders(signal),
    enabled: computed(() => authStore.isAuthenticated),
    staleTime: 5 * 60 * 1000,
  })
}
