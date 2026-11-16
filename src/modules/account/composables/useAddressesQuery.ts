import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { identityQueryKey, ADDRESSES_KEY } from '@/modules/auth/private-query-cache'
import { AccountService } from '../api/account.service'

export { ADDRESSES_KEY }

export const useAddressesQuery = () => {
  const authStore = useAuthStore()

  return useQuery({
    queryKey: computed(() => identityQueryKey(ADDRESSES_KEY, authStore.client?.id)),
    queryFn: ({ signal }) => AccountService.getAddresses(signal),
    enabled: computed(() => authStore.isAuthenticated),
  })
}
