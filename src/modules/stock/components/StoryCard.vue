<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { useProximityImageSource } from '@/modules/shared/composables/useProximityImageSource'
import {
  productPhotoQueueKey,
  type ProductPhotoHandle,
} from '@/modules/menu/utils/productPhotoQueue'
import { useI18n } from 'vue-i18n'
import type { Stock } from '../api/stock.service'
import { useSeenStories } from '../composables/useSeenStories'

const props = defineProps<{ story: Stock }>()
defineEmits<{ open: [] }>()

const { t } = useI18n()
const { isSeen } = useSeenStories()
const imageFailed = ref(false)
const imageReady = ref(false)
const element = ref<HTMLElement | null>(null)
const source = computed(() => props.story.photo_url)
const nearbySource = useProximityImageSource(element, source)
const queue = inject(productPhotoQueueKey, null)
const backgroundGranted = ref(false)
const forceVisible = ref(false)
const imageSource = computed(() =>
  queue
    ? forceVisible.value || backgroundGranted.value
      ? source.value
      : undefined
    : nearbySource.value,
)
let handle: ProductPhotoHandle | null = null
function visibleInStrip(card: HTMLElement, viewport: { width: number; height: number }) {
  const rect = card.getBoundingClientRect()
  const strip = card.parentElement?.getBoundingClientRect()
  return (
    !!strip &&
    rect.left < strip.right &&
    rect.right > strip.left &&
    rect.top < viewport.height &&
    rect.bottom > 0
  )
}
onMounted(() => {
  if (!queue || !element.value) return
  handle = queue.register(
    element.value,
    source.value ?? '',
    false,
    (kind) => {
      if (kind === 'background') backgroundGranted.value = true
      else {
        forceVisible.value = true
        backgroundGranted.value = false
      }
    },
    () => {
      backgroundGranted.value = false
    },
    visibleInStrip,
  )
})
onUnmounted(() => handle?.remove())
watch(
  () => props.story.photo_url,
  (url) => {
    imageFailed.value = false
    imageReady.value = false
    backgroundGranted.value = false
    forceVisible.value = false
    handle?.update(url ?? '', false)
  },
)
function imageLoaded() {
  imageReady.value = true
  handle?.settle()
}
function imageError() {
  imageFailed.value = true
  handle?.settle()
}
</script>

<template>
  <button
    ref="element"
    type="button"
    class="relative aspect-3/4 overflow-hidden rounded-3xl text-left cursor-pointer focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
    :class="{ 'outline-3 outline-offset-2 outline-primary': !isSeen(story.id!) }"
    :aria-busy="!!story.photo_url && !imageReady && !imageFailed"
    @click="$emit('open')"
  >
    <img
      v-if="!imageFailed && imageSource && imageReady"
      :src="imageSource"
      alt=""
      aria-hidden="true"
      :loading="backgroundGranted ? 'eager' : 'lazy'"
      :fetchpriority="backgroundGranted ? 'low' : undefined"
      class="absolute inset-0 size-full scale-125 object-cover blur-xl brightness-60 saturate-125"
    />
    <span
      v-if="!imageFailed && imageSource && imageReady"
      class="absolute inset-0 bg-black/10"
      aria-hidden="true"
    />
    <img
      v-if="!imageFailed && imageSource"
      :src="imageSource"
      :alt="story.text || t('stock.single')"
      :loading="backgroundGranted ? 'eager' : 'lazy'"
      :fetchpriority="backgroundGranted ? 'low' : undefined"
      class="absolute inset-0 size-full object-contain transition-opacity duration-200 motion-reduce:transition-none"
      :class="imageReady ? 'opacity-100' : 'opacity-0'"
      @load="imageLoaded"
      @error="imageError"
    />
    <span
      v-else-if="imageFailed || !story.photo_url"
      class="absolute inset-0 grid place-items-center p-4 text-center font-semibold text-gray-700"
    >
      {{ story.text || t('stock.single') }}
    </span>
  </button>
</template>
