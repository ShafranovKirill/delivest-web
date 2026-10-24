<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { tagSoft, tagText, type ProductTag } from '../../../utils/productTags'
import ProductTagIcon from './ProductTagIcon.vue'

defineProps<{ tags: ProductTag[] }>()
const { t } = useI18n()
</script>

<template>
  <span v-if="tags.length" class="flex flex-wrap gap-1.5">
    <span
      v-for="tag in tags"
      :key="tag"
      class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      :class="[tagSoft[tag], tagText[tag]]"
    >
      <ProductTagIcon :tag="tag" class="size-3.5" />
      {{ t(`menu.tags.${tag}`) }}
    </span>
  </span>
</template>
