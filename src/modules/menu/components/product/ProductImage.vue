<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { useProximityImageSource } from '@/modules/shared/composables/useProximityImageSource'
import { productImageSrcset, type PhotoVariant } from '../../utils/productImageSources'
import { useProductImageState } from '../../composables/useProductImageState'
import { productPhotoQueueKey, type ProductPhotoHandle } from '../../utils/productPhotoQueue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    variants?: PhotoVariant[] | null
    sizes?: string
    alt?: string
    fit?: 'cover' | 'contain'
    coordinated?: boolean
  }>(),
  { fit: 'cover', sizes: '(min-width: 640px) 256px, 200px' },
)

const element = ref<HTMLElement | null>(null)
const source = computed(() => props.src)
const queue = props.coordinated ? inject(productPhotoQueueKey, null) : null
const nearbySource = useProximityImageSource(element, source, '500px')
const currentNearbySource = computed(() => nearbySource.value === source.value ? nearbySource.value : undefined)
const backgroundGranted = ref(false)
const forceVisible = ref(false)
const imageSource = computed(() =>
  currentNearbySource.value || (forceVisible.value || backgroundGranted.value ? source.value : undefined),
)
const photoVersion = ref(0)
let handle: ProductPhotoHandle | null = null
let previousSource = source.value
const { state, srcset, hasPhoto, onError } = useProductImageState(
  source,
  computed(() => props.variants),
  imageSource,
)

const signature = computed(() => source.value ? `${source.value}\u0000${productImageSrcset(props.variants)}` : '')
onMounted(() => {
  if (!queue || !element.value) return
  handle = queue.register(
    element.value,
    signature.value,
    Boolean(currentNearbySource.value),
    kind => {
      if (kind === 'background') backgroundGranted.value = true
      else { forceVisible.value = true; backgroundGranted.value = false }
    },
    () => { backgroundGranted.value = false },
  )
  if (state.value === 'loaded' || state.value === 'failed') handle.settle()
})
onUnmounted(() => handle?.remove())
watch(signature, next => {
  const sourceChanged = source.value !== previousSource
  previousSource = source.value
  // Added variants may leave the browser's selected candidate unchanged.
  // Keep a photo that already loaded visible and settled in that case.
  if (!sourceChanged && state.value === 'loaded') {
    handle?.update(next, Boolean(currentNearbySource.value))
    handle?.settle()
    return
  }
  photoVersion.value++
  backgroundGranted.value = false
  forceVisible.value = false
  if (state.value === 'loaded') state.value = 'loading'
  handle?.update(next, Boolean(currentNearbySource.value))
}, { flush: 'sync' })
watch(currentNearbySource, value => handle?.setNear(Boolean(value)), { flush: 'sync' })

function imageLoaded(event: Event) {
  if (Number((event.currentTarget as HTMLElement).dataset.photoVersion) !== photoVersion.value) return
  state.value = 'loaded'
  handle?.settle()
}

function imageFailed(event: Event) {
  if (Number((event.currentTarget as HTMLElement).dataset.photoVersion) !== photoVersion.value) return
  onError()
  if (state.value === 'failed') handle?.settle()
}
</script>

<template>
  <span ref="element" class="relative block overflow-hidden">
    <img
      v-if="state !== 'loaded'"
      src="/placeholder/product-placeholder.svg"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 size-full object-contain"
      :class="{ 'opacity-70 motion-safe:animate-[spin_8s_linear_infinite]': hasPhoto }"
    />
    <img
      v-if="hasPhoto && imageSource"
      :key="photoVersion"
      :src="imageSource"
      :srcset="srcset"
      :sizes="srcset ? sizes : undefined"
      :data-photo-version="photoVersion"
      :alt="alt"
      :loading="backgroundGranted ? 'eager' : 'lazy'"
      :fetchpriority="backgroundGranted ? 'low' : undefined"
      decoding="async"
      class="relative size-full transition-opacity duration-300 motion-reduce:transition-none"
      :class="[
        fit === 'cover' ? 'object-cover' : 'object-contain',
        { 'opacity-0': state !== 'loaded' },
      ]"
      @load="imageLoaded"
      @error="imageFailed"
    />
  </span>
</template>
