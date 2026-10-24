import { useLocalStorage } from '@vueuse/core'

const seen = useLocalStorage<string[]>('delivest-seen-stories', [])

export function useSeenStories() {
  function isSeen(id: string) {
    return seen.value.includes(id)
  }

  function markSeen(id: string) {
    if (!isSeen(id)) seen.value = [...seen.value.slice(-99), id]
  }

  return { isSeen, markSeen }
}
