import { ref } from 'vue'
import { GeoService, type GeoAddress } from '../api/geo.service'
import type { LngLat } from '../utils/deliveryAddress'

const DELAY_MS = 700
const MIN_ZOOM = 15

export function useReverseGeocode(onFound: (address: GeoAddress | null, point: LngLat) => void) {
  const isLocating = ref(false)
  const locateError = ref(false)
  const notFound = ref(false)
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  function remember() {
    generation++
    clearTimeout(timer)
    isLocating.value = false
    locateError.value = false
    notFound.value = false
  }

  function locate(point: LngLat, zoom: number) {
    remember()
    if (zoom < MIN_ZOOM) return
    const current = generation
    isLocating.value = true
    timer = setTimeout(async () => {
      try {
        const address = await GeoService.reverse(point[1], point[0])
        if (current === generation) {
          notFound.value = !address
          onFound(address, point)
        }
      } catch {
        if (current === generation) locateError.value = true
      } finally {
        if (current === generation) isLocating.value = false
      }
    }, DELAY_MS)
  }

  return { isLocating, locateError, notFound, locate, remember }
}
