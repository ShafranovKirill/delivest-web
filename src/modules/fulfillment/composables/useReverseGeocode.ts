import { ref } from 'vue'
import { GeoService, type GeoAddress } from '../api/geo.service'
import type { LngLat } from '../utils/deliveryAddress'

export function useReverseGeocode() {
  const isLocating = ref(false)
  let latest = 0

  async function locate([longitude, latitude]: LngLat): Promise<GeoAddress | null> {
    const request = ++latest
    isLocating.value = true

    try {
      const address = await GeoService.reverse(latitude, longitude)
      return request === latest ? address : null
    } catch {
      return null
    } finally {
      if (request === latest) isLocating.value = false
    }
  }

  return { isLocating, locate }
}
