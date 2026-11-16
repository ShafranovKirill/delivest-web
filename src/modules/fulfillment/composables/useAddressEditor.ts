import { computed, getCurrentScope, onScopeDispose, ref, toRaw, watch, type Ref } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { ClientAddress } from '@/modules/account/api/account.service'
import type { GeoAddress } from '../api/geo.service'
import { useReverseGeocode } from './useReverseGeocode'
import { branchLngLat, fallbackLngLat } from '../utils/branchLocation'
import {
  fromClientAddress,
  isComplete,
  lngLatOf,
  normalizeDeliveryAddress,
  withGeo,
  type DeliveryAddress,
  type LngLat,
} from '../utils/deliveryAddress'

export function useAddressEditor(address: Ref<DeliveryAddress>, requireCoordinates: () => boolean) {
  const branchStore = useBranchStore()
  address.value = normalizeDeliveryAddress(address.value)
  let lastOwnWrite = toRaw(address.value)

  function assignAddress(next: DeliveryAddress) {
    lastOwnWrite = next
    address.value = next
  }

  const mapCenter = ref<LngLat>(
    lngLatOf(address.value) ??
      branchLngLat(branchStore.activeBranch) ??
      fallbackLngLat(branchStore.branches),
  )
  let lastLocate: { point: LngLat; zoom: number } | null = null

  const {
    isLocating,
    locateError,
    notFound,
    locate: reverseLocate,
    remember,
  } = useReverseGeocode((geo, [longitude, latitude]) => {
    if (geo) assignAddress({ ...withGeo(address.value, geo), longitude, latitude })
  })

  watch(
    address,
    (next) => {
      if (toRaw(next) !== lastOwnWrite) remember()
    },
    { flush: 'sync' },
  )
  watch(() => branchStore.activeBranch?.id, remember)
  if (getCurrentScope()) onScopeDispose(remember)

  function locate(point: LngLat, zoom: number) {
    lastLocate = { point, zoom }
    assignAddress({
      ...address.value,
      street: '',
      house: '',
      geo: null,
      longitude: point[0],
      latitude: point[1],
    })
    reverseLocate(point, zoom)
  }

  function invalidate() {
    remember()
  }

  function startMoving() {
    remember()
    assignAddress({
      ...address.value,
      street: '',
      house: '',
      geo: null,
      longitude: null,
      latitude: null,
    })
  }

  function retryLocate() {
    if (lastLocate) locate(lastLocate.point, lastLocate.zoom)
  }

  const isReady = computed(() =>
    requireCoordinates()
      ? isComplete(address.value) && lngLatOf(address.value) !== null
      : isComplete(address.value),
  )

  function focus(next: DeliveryAddress) {
    assignAddress(next)
    mapCenter.value = lngLatOf(next) ?? mapCenter.value
    remember()
  }

  const pickSuggestion = (geo: GeoAddress) => focus(withGeo(address.value, geo))
  const pickSaved = (saved: ClientAddress) => focus(fromClientAddress(saved))

  return {
    mapCenter,
    isLocating,
    locateError,
    notFound,
    locate,
    invalidate,
    startMoving,
    retryLocate,
    isReady,
    pickSuggestion,
    pickSaved,
  }
}
