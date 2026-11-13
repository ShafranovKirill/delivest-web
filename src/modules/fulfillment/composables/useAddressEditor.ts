import { computed, ref, type Ref } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { ClientAddress } from '@/modules/account/api/account.service'
import type { GeoAddress } from '../api/geo.service'
import { useReverseGeocode } from './useReverseGeocode'
import { branchLngLat, fallbackLngLat } from '../utils/branchLocation'
import {
  fromClientAddress,
  isComplete,
  lngLatOf,
  withGeo,
  type DeliveryAddress,
  type LngLat,
} from '../utils/deliveryAddress'

export function useAddressEditor(address: Ref<DeliveryAddress>, requireCoordinates: () => boolean) {
  const branchStore = useBranchStore()

  const mapCenter = ref<LngLat>(
    lngLatOf(address.value) ??
      branchLngLat(branchStore.activeBranch) ??
      fallbackLngLat(branchStore.branches),
  )

  const {
    isLocating,
    locate: reverseLocate,
    remember,
  } = useReverseGeocode((geo, [longitude, latitude]) => {
    address.value = { ...(geo ? withGeo(address.value, geo) : address.value), longitude, latitude }
  })

  function locate(point: LngLat, zoom: number) {
    if (zoom < 15) return
    address.value = { ...address.value, longitude: point[0], latitude: point[1] }
    reverseLocate(point, zoom)
  }

  remember(lngLatOf(address.value))

  const isReady = computed(() =>
    requireCoordinates()
      ? isComplete(address.value) && lngLatOf(address.value) !== null
      : Boolean(address.value.street.trim()),
  )

  function focus(next: DeliveryAddress) {
    address.value = next
    mapCenter.value = lngLatOf(next) ?? mapCenter.value
    remember(lngLatOf(next))
  }

  const pickSuggestion = (geo: GeoAddress) => focus(withGeo(address.value, geo))
  const pickSaved = (saved: ClientAddress) => focus(fromClientAddress(saved))

  return { mapCenter, isLocating, locate, isReady, pickSuggestion, pickSaved }
}
