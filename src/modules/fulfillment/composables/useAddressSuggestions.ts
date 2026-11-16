import { ref } from 'vue'
import { GeoService, type GeoAddress } from '../api/geo.service'

const MIN_LENGTH = 4
const DELAY_MS = 550

const normalize = (query: string) =>
  query
    .toLowerCase()
    .replace(/[\s,.]+/g, ' ')
    .trim()

const isUnfinished = (query: string) => /[\s,]$/.test(query)

export function useAddressSuggestions() {
  const suggestions = ref<GeoAddress[]>([])
  const error = ref(false)
  const loading = ref(false)
  const hasSearched = ref(false)
  const cache = new Map<string, GeoAddress[]>()
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  function clear() {
    generation++
    clearTimeout(timer)
    suggestions.value = []
    error.value = false
    loading.value = false
    hasSearched.value = false
  }

  async function fetch(key: string, query: string, city: string | null, current: number) {
    try {
      const result = await GeoService.suggest(query, city)
      if (disposed || current !== generation) return
      cache.set(key, result)
      suggestions.value = result
      hasSearched.value = true
    } catch {
      if (!disposed && current === generation) error.value = true
    } finally {
      if (!disposed && current === generation) loading.value = false
    }
  }

  function search(query: string, city: string | null = null) {
    if (disposed) return
    const normalized = normalize(query)
    const key = `${normalize(city ?? '')}:${normalized}`
    clear()
    if (normalized.length < MIN_LENGTH || isUnfinished(query)) {
      return
    }

    if (cache.has(key)) {
      suggestions.value = cache.get(key)!
      hasSearched.value = true
    } else {
      loading.value = true
      const current = generation
      timer = setTimeout(() => fetch(key, query, city, current), DELAY_MS)
    }
  }

  function dispose() {
    disposed = true
    clear()
  }

  return { suggestions, error, loading, hasSearched, search, clear, dispose }
}
