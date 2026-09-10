import { watch, nextTick, type Ref } from 'vue'

export function useMobCatBarScroll(
  activeId: Ref<string | null | undefined>,
  containerRef: Ref<HTMLElement | null>,
) {
  watch(activeId, async (newId) => {
    if (!newId || !containerRef.value) return

    await nextTick()

    const container = containerRef.value
    const activeButton = container.querySelector(`[data-id="${newId}"]`) as HTMLElement

    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  })
}
