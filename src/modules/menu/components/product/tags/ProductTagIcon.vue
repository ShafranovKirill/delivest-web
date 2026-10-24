<script setup lang="ts">
import type { ProductTag } from '../../../utils/productTags'

defineProps<{ tag: ProductTag }>()
</script>

<template>
  <i-tabler-flame v-if="tag === 'hit'" />
  <i-tabler-sparkles v-else-if="tag === 'new'" />
  <i-tabler-pepper v-else-if="tag === 'spicy'" />
  <i-tabler-leaf v-else />
</template>
