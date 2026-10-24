<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Stock } from '../api/stock.service'
import { useSeenStories } from '../composables/useSeenStories'

defineProps<{ story: Stock }>()
defineEmits<{ open: [] }>()

const { t } = useI18n()
const { isSeen } = useSeenStories()
</script>

<template>
  <button
    type="button"
    class="group relative aspect-3/4 overflow-hidden rounded-3xl bg-gray-300 text-left cursor-pointer"
    :class="{ 'outline-3 outline-offset-2 outline-primary': !isSeen(story.id!) }"
    @click="$emit('open')"
  >
    <img
      :src="story.photo_url"
      :alt="story.text || t('stock.single')"
      loading="lazy"
      class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
    <span
      v-if="story.text"
      class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-3 pt-10 pb-3"
    >
      <span class="line-clamp-3 text-[13px] font-semibold leading-snug text-white">
        {{ story.text }}
      </span>
    </span>
  </button>
</template>
