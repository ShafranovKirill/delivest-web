<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Stock } from '../api/stock.service'
import { useSeenStories } from '../composables/useSeenStories'

const props = defineProps<{ story: Stock }>()
defineEmits<{ open: [] }>()

const { t } = useI18n()
const { isSeen } = useSeenStories()
const imageFailed = ref(false)
watch(
  () => props.story.photo_url,
  () => {
    imageFailed.value = false
  },
)
</script>

<template>
  <button
    type="button"
    class="relative aspect-3/4 overflow-hidden rounded-3xl bg-gray-300 text-left cursor-pointer focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
    :class="{ 'outline-3 outline-offset-2 outline-primary': !isSeen(story.id!) }"
    @click="$emit('open')"
  >
    <img
      v-if="!imageFailed"
      :src="story.photo_url"
      alt=""
      aria-hidden="true"
      loading="lazy"
      class="absolute inset-0 size-full scale-125 object-cover blur-xl brightness-60 saturate-125"
    />
    <span v-if="!imageFailed" class="absolute inset-0 bg-black/10" aria-hidden="true" />
    <img
      v-if="!imageFailed"
      :src="story.photo_url"
      :alt="story.text || t('stock.single')"
      loading="lazy"
      class="absolute inset-0 size-full object-contain"
      @error="imageFailed = true"
    />
    <span
      v-else
      class="absolute inset-0 grid place-items-center p-4 text-center font-semibold text-gray-700"
    >
      {{ story.text || t('stock.single') }}
    </span>
  </button>
</template>
