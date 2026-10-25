<script setup lang="ts">
import type { ProductTag } from '../../../utils/productTags'

defineProps<{ tags: ProductTag[] }>()
</script>

<template>
  <span v-if="tags.length" class="flex flex-wrap gap-1.5">
    <span
      v-for="tag in tags"
      :key="tag.id"
      class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800"
    >
      <img v-if="tag.icon_url" :src="tag.icon_url" alt="" class="size-3.5 object-contain" />
      {{ tag.name }}
    </span>
  </span>
</template>
