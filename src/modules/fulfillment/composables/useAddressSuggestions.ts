import { ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { GeoService, type GeoAddress } from '../api/geo.service'

export function useAddressSuggestions(city: () => string | null) {
  const suggestions = ref<GeoAddress[]>([])

  const search = useDebounceFn(async (query: string) => {
    try {
      suggestions.value = await GeoService.suggest(query, city())
    } catch {
      suggestions.value = []
    }
  }, 250)

  return { suggestions, search }
}
