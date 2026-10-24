<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useOpenCart } from '@/modules/cart/composables/useOpenCart'
import { intlLocale } from '@/i18n'
import { useI18n } from 'vue-i18n'

const openCartModal = useOpenCart()
const cartStore = useCartStore()
const { t } = useI18n()

const buttonLabel = computed(() => {
  if (cartStore.totalAmount > 0) {
    return `${cartStore.totalAmount.toLocaleString(intlLocale())} ₽`
  }
  return t('cart.title')
})
</script>

<template>
  <Button
    class="rounded-4xl! h-12!"
    icon="pi pi-shopping-bag"
    :label="buttonLabel"
    :loading="cartStore.isLoading && !cartStore.isInitialized"
    @click="openCartModal"
  />
</template>
