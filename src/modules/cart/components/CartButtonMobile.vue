<script setup lang="ts">
import { formatPrice } from '@/utils/money'
import { computed } from 'vue'
import Button from 'primevue/button'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useOpenCart } from '@/modules/cart/composables/useOpenCart'
import CartBasketIcon from './CartBasketIcon.vue'

const openCartModal = useOpenCart()
const cartStore = useCartStore()

const formattedTotal = computed(() => {
  return formatPrice(cartStore.totalAmount)
})
</script>

<template>
  <Button
    v-if="!cartStore.isEmpty"
    class="fixed! bottom-6 right-6 h-15! z-50 w-auto! shrink-0 rounded-full! px-6! min-w-max flex! items-center justify-center gap-2!"
    @click="openCartModal"
  >
    <CartBasketIcon class="size-8 shrink-0 -translate-y-[1px]" />
    <span class="font-sans text-[18px] font-bold tabular-nums whitespace-nowrap">{{ formattedTotal }}</span>
  </Button>
</template>
