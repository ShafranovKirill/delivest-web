import { computed, ref, watch, type Ref } from 'vue'
import { productImageSrcset, type PhotoVariant } from '../utils/productImageSources'

export function useProductImageState(
  source: Ref<string | null | undefined>,
  variants: Ref<PhotoVariant[] | null | undefined>,
  nearbySource: Ref<string | null | undefined>,
) {
  const state = ref<'loading' | 'loaded' | 'failed'>('loading')
  const variantsFailed = ref(false)
  const srcset = computed(() =>
    nearbySource.value && !variantsFailed.value ? productImageSrcset(variants.value) : undefined,
  )
  const hasPhoto = computed(() => Boolean(source.value) && state.value !== 'failed')

  watch(
    source,
    () => {
      state.value = 'loading'
      variantsFailed.value = false
    },
    { flush: 'sync' },
  )

  // A background refresh may replace variant metadata without changing the
  // photo. An unchanged <img> does not dispatch another load event.
  watch(
    () => productImageSrcset(variants.value),
    (next, previous) => {
      if (next === previous) return
      variantsFailed.value = false
      if (state.value === 'failed' && source.value) state.value = 'loading'
    },
    { flush: 'sync' },
  )

  function onError() {
    if (srcset.value && source.value) {
      variantsFailed.value = true
      return
    }
    state.value = 'failed'
  }

  return { state, srcset, hasPhoto, onError }
}
