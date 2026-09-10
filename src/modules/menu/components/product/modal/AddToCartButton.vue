<script setup lang="ts">
import type { MenuProduct } from '@/modules/menu/api/menu.service'

const props = defineProps<{
  product?: MenuProduct | null
}>()

const handleAddToCart = () => {
  if (!props.product) return
}
</script>

<template>
  <Button
    @click="handleAddToCart"
    class="whitespace-nowrap rounded-3xl! w-full! flex items-center justify-center gap-2 py-3.5! px-6 font-semibold transition-all hover:opacity-95"
  >
    <span>В корзину за {{ product?.price }} ₽</span>

    <span v-if="product?.old_price" class="line-through text-xs opacity-70 font-normal">
      {{ product.old_price }} ₽
    </span>
  </Button>
</template>
