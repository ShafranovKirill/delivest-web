import { computed } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

export const STORY_QUERY_KEY = 'story'

let openedHere = false

export function useStoryRoute() {
  const route = useRoute()
  const router = useRouter()

  const storyId = computed(() => {
    const value = route.query[STORY_QUERY_KEY]
    return typeof value === 'string' && value ? value : null
  })

  function withStory(id: string | null) {
    const query = { ...route.query }
    if (id) query[STORY_QUERY_KEY] = id
    else delete query[STORY_QUERY_KEY]
    return query
  }

  function open(id: string) {
    openedHere = true
    router.push({ query: withStory(id) })
  }

  function show(id: string) {
    router.replace({ query: withStory(id) })
  }

  function close() {
    if (openedHere) router.back()
    else router.replace({ query: withStory(null) })
    openedHere = false
  }

  function leaveTo(location: RouteLocationRaw) {
    openedHere = false
    router.replace(location)
  }

  return { storyId, open, show, close, leaveTo }
}
