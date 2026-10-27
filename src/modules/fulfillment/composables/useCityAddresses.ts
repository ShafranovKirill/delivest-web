import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useAddressesQuery } from '@/modules/account/composables/useAddressesQuery'
import { sameCity } from '../utils/deliveryAddress'

export function useCityAddresses(city: MaybeRefOrGetter<string | null>) {
  const { data } = useAddressesQuery()

  return computed(() =>
    (data.value ?? []).filter((address) => sameCity(address.city ?? '', toValue(city))),
  )
}
