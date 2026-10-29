<script setup lang="ts">
import { formatPrice } from '@/utils/money'
import { computed } from 'vue'
import Button from 'primevue/button'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useOpenCart } from '@/modules/cart/composables/useOpenCart'

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
    <i class="pi pi-shopping-bag text-xl! shrink-0"></i>
    <span class="font-medium whitespace-nowrap text-base">{{ formattedTotal }}</span>
  </Button>
</template>
