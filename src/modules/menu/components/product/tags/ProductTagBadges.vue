<script setup lang="ts">
import type { ProductTag } from '../../../utils/productTags'

defineProps<{ tags: ProductTag[] }>()
</script>

<template>
  <span v-if="tags.length" class="flex flex-col gap-1">
    <span
      v-for="tag in tags"
      :key="tag.id"
      class="grid size-8 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm"
      :title="tag.name"
      :aria-label="tag.name"
    >
      <img v-if="tag.icon_url" :src="tag.icon_url" alt="" class="size-4.5 object-contain" />
    </span>
  </span>
</template>
