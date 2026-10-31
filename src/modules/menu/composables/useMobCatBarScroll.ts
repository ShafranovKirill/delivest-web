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
      const firstButton = container.querySelector('[data-id]')
      const left =
        activeButton === firstButton
          ? 0
          : container.scrollLeft +
            activeButton.getBoundingClientRect().left -
            container.getBoundingClientRect().left -
            (container.clientWidth - activeButton.offsetWidth) / 2
      container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
    }
  })
}
