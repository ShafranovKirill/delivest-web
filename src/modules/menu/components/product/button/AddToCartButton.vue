<script setup lang="ts">
import { useCartStore } from '@/modules/cart/stores/cart.store'
import type { MenuProduct } from '@/modules/menu/api/menu.service'

const props = defineProps<{
  product?: MenuProduct | null
}>()

const emit = defineEmits<{
  (e: 'added'): void
}>()

const cartStore = useCartStore()

const handleAddToCart = async () => {
  if (!props.product) return
  await cartStore.addItem(props.product.id!)
  emit('added')
}
</script>

<template>
  <Button
    @click="handleAddToCart"
    :loading="cartStore.isLoading"
    :disabled="!product || cartStore.isLoading"
    class="whitespace-nowrap rounded-3xl! w-full! flex items-center justify-center gap-2 py-3.5! px-6 font-semibold transition-all hover:opacity-95"
  >
    <span>В корзину за {{ product?.price }} ₽</span>

    <span
      v-if="product?.old_price && product.old_price !== '0.00'"
      class="line-through text-xs opacity-70 font-normal"
    >
      {{ product.old_price }} ₽
    </span>
  </Button>
</template>
