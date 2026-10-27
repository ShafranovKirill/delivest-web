import { ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { GeoService, type GeoAddress } from '../api/geo.service'
import type { LngLat } from '../utils/deliveryAddress'
import { distanceMeters } from '../utils/distance'

const DELAY_MS = 700
const MIN_ZOOM = 15
const MIN_SHIFT_M = 20

export function useReverseGeocode(onFound: (address: GeoAddress, point: LngLat) => void) {
  const isLocating = ref(false)
  let lastPoint: LngLat | null = null

  async function fetch(point: LngLat) {
    try {
      const address = await GeoService.reverse(point[1], point[0])
      if (address && point === lastPoint) onFound(address, point)
    } catch {
      return
    } finally {
      if (point === lastPoint) isLocating.value = false
    }
  }

  const request = useDebounceFn(fetch, DELAY_MS)

  function locate(point: LngLat, zoom: number) {
    if (zoom < MIN_ZOOM) return
    if (lastPoint && distanceMeters(lastPoint, point) < MIN_SHIFT_M) return

    lastPoint = point
    isLocating.value = true
    request(point)
  }

  function remember(point: LngLat | null) {
    lastPoint = point
    isLocating.value = false
  }

  return { isLocating, locate, remember }
}
