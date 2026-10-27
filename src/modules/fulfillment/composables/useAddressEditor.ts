import { computed, ref, toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { ClientAddress } from '@/modules/account/api/account.service'
import type { GeoAddress } from '../api/geo.service'
import { useReverseGeocode } from './useReverseGeocode'
import { branchLngLat, fallbackLngLat } from '../utils/branchLocation'
import {
  fromClientAddress,
  isComplete,
  lngLatOf,
  sameCity,
  withGeo,
  type DeliveryAddress,
  type LngLat,
} from '../utils/deliveryAddress'

export function useAddressEditor(
  address: Ref<DeliveryAddress>,
  city: MaybeRefOrGetter<string | null>,
) {
  const branchStore = useBranchStore()

  const mapCenter = ref<LngLat>(
    lngLatOf(address.value) ??
      branchLngLat(branchStore.activeBranch) ??
      fallbackLngLat(branchStore.branches),
  )

  const { isLocating, locate, remember } = useReverseGeocode((geo, [longitude, latitude]) => {
    address.value = { ...withGeo(address.value, geo), longitude, latitude }
  })

  remember(lngLatOf(address.value))

  const outsideCity = computed(() => !sameCity(address.value.city, toValue(city)))
  const isReady = computed(() => isComplete(address.value) && !outsideCity.value)

  function focus(next: DeliveryAddress) {
    address.value = next
    mapCenter.value = lngLatOf(next) ?? mapCenter.value
    remember(lngLatOf(next))
  }

  const pickSuggestion = (geo: GeoAddress) => focus(withGeo(address.value, geo))
  const pickSaved = (saved: ClientAddress) => focus(fromClientAddress(saved))

  return { mapCenter, isLocating, locate, outsideCity, isReady, pickSuggestion, pickSaved }
}
