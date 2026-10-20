import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AccountService } from '../api/account.service'

export const MY_ORDERS_KEY = ['my-orders']

export const useMyOrdersQuery = () => {
  const authStore = useAuthStore()

  return useQuery({
    queryKey: MY_ORDERS_KEY,
    queryFn: AccountService.getOrders,
    enabled: computed(() => authStore.isAuthenticated),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}
