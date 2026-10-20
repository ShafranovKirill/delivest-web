import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AccountService } from '../api/account.service'

export const ADDRESSES_KEY = ['addresses']

export const useAddressesQuery = () => {
  const authStore = useAuthStore()

  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: AccountService.getAddresses,
    enabled: computed(() => authStore.isAuthenticated),
  })
}
