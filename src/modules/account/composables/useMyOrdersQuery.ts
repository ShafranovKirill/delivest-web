import { computed } from 'vue'
import { useInfiniteQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { identityQueryKey, MY_ORDERS_KEY } from '@/modules/auth/private-query-cache'
import { AccountService } from '../api/account.service'

export { MY_ORDERS_KEY }

export const useMyOrdersQuery = () => {
  const authStore = useAuthStore()

  return useInfiniteQuery({
    queryKey: computed(() => identityQueryKey(MY_ORDERS_KEY, authStore.client?.id)),
    queryFn: ({ signal, pageParam }) => AccountService.getOrders(pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: computed(() => authStore.isAuthenticated),
    staleTime: 5 * 60 * 1000,
  })
}
