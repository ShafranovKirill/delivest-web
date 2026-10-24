<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { tagText, type ProductTag } from '../../../utils/productTags'
import ProductTagIcon from './ProductTagIcon.vue'

defineProps<{ tags: ProductTag[] }>()
const { t } = useI18n()
</script>

<template>
  <span v-if="tags.length" class="flex flex-col gap-1">
    <span
      v-for="tag in tags"
      :key="tag"
      class="grid size-8 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm"
      :class="tagText[tag]"
      :title="t(`menu.tags.${tag}`)"
      :aria-label="t(`menu.tags.${tag}`)"
    >
      <ProductTagIcon :tag="tag" class="size-4.5" />
    </span>
  </span>
</template>
