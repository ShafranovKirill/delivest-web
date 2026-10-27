import { ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { GeoService, type GeoAddress } from '../api/geo.service'

const MIN_LENGTH = 4
const DELAY_MS = 550

const normalize = (query: string) =>
  query
    .toLowerCase()
    .replace(/[\s,.]+/g, ' ')
    .trim()

const isUnfinished = (query: string) => /[\s,]$/.test(query)

export function useAddressSuggestions(city: () => string | null) {
  const suggestions = ref<GeoAddress[]>([])
  const cache = new Map<string, GeoAddress[]>()
  let lastKey = ''

  async function fetch(key: string, query: string) {
    if (!cache.has(key)) cache.set(key, await GeoService.suggest(query, city()).catch(() => []))
    if (key === lastKey) suggestions.value = cache.get(key)!
  }

  const request = useDebounceFn(fetch, DELAY_MS)

  function search(query: string) {
    const normalized = normalize(query)
    const key = `${city() ?? ''}|${normalized}`
    if (normalized.length < MIN_LENGTH || isUnfinished(query) || key === lastKey) return

    lastKey = key
    if (cache.has(key)) suggestions.value = cache.get(key)!
    else request(key, query)
  }

  return { suggestions, search }
}
