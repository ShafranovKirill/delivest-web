import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

export function useProximityImageSource(
  element: Ref<HTMLElement | null>,
  source: Ref<string | null | undefined>,
) {
  const imageSource = ref<string | null | undefined>()
  let nearby = false
  let observer: IntersectionObserver | undefined

  watch(source, value => {
    // A changed photo must wait until its element is near the viewport again.
    imageSource.value = nearby ? value : undefined
  })

  onMounted(() => {
    if (!element.value || typeof IntersectionObserver === 'undefined') {
      nearby = true
      imageSource.value = source.value
      return
    }

    observer = new IntersectionObserver(entries => {
      nearby = entries[0]?.isIntersecting ?? false
      if (nearby) imageSource.value = source.value
    }, { rootMargin: '1250px' })
    observer.observe(element.value)
  })

  onUnmounted(() => observer?.disconnect())
  return imageSource
}
