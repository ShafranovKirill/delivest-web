import { useLocalStorage } from '@vueuse/core'

const previewReset = import.meta.env.DEV && import.meta.env.VITE_PREVIEW_STORIES_RESET
const storageKey = previewReset
  ? `delivest-seen-stories-${previewReset}`
  : 'delivest-seen-stories'
const seen = useLocalStorage<string[]>(storageKey, [])

export function useSeenStories() {
  function isSeen(id: string) {
    return seen.value.includes(id)
  }

  function markSeen(id: string) {
    if (!isSeen(id)) seen.value = [...seen.value.slice(-99), id]
  }

  return { isSeen, markSeen }
}
