<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useProximityImageSource } from '@/modules/shared/composables/useProximityImageSource'
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
const imageSource = useProximityImageSource(element, source)
watch(
  () => props.story.photo_url,
  () => {
    imageFailed.value = false
    imageReady.value = false
  },
)
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
      loading="lazy"
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
      loading="lazy"
      class="absolute inset-0 size-full object-contain transition-opacity duration-200 motion-reduce:transition-none"
      :class="imageReady ? 'opacity-100' : 'opacity-0'"
      @load="imageReady = true"
      @error="imageFailed = true"
    />
    <span
      v-else-if="imageFailed || !story.photo_url"
      class="absolute inset-0 grid place-items-center p-4 text-center font-semibold text-gray-700"
    >
      {{ story.text || t('stock.single') }}
    </span>
  </button>
</template>
