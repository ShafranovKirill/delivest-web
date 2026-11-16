import { computed } from 'vue'
import { useAddressesQuery } from '@/modules/account/composables/useAddressesQuery'

export function useDeliveryAddresses() {
  const { data } = useAddressesQuery()
  return computed(() => data.value ?? [])
}
