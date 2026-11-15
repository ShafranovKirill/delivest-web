<script setup lang="ts">
import { formatPrice } from '@/utils/money'
import { computed } from 'vue'
import Button from 'primevue/button'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useOpenCart } from '@/modules/cart/composables/useOpenCart'
import { useI18n } from 'vue-i18n'
import CartBasketIcon from './CartBasketIcon.vue'

const openCartModal = useOpenCart()
const cartStore = useCartStore()
const { t } = useI18n()

const buttonLabel = computed(() => {
  if (cartStore.totalAmount > 0) {
    return formatPrice(cartStore.totalAmount)
  }
  return t('cart.title')
})
</script>

<template>
  <Button
    class="rounded-4xl! h-12!"
    :label="buttonLabel"
    :loading="cartStore.isLoading && !cartStore.isInitialized"
    :pt="{
      label: {
        class:
          cartStore.totalAmount > 0
            ? 'font-sans text-[18px] font-bold tabular-nums whitespace-nowrap'
            : '',
      },
    }"
    @click="openCartModal"
  >
    <template #icon>
      <CartBasketIcon class="size-6 shrink-0" />
    </template>
  </Button>
</template>
