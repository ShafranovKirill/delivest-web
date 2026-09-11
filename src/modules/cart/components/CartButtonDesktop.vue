<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import CartComponent from '@/modules/cart/components/CartComponent.vue'
import { useDesktopModalStore } from '@/modules/widgets/modal/modal-desktop/stores/modal.store'
import { useCartStore } from '@/modules/cart/stores/cart.store'

const desktopModalStore = useDesktopModalStore()
const cartStore = useCartStore()

const buttonLabel = computed(() => {
  if (cartStore.totalAmount > 0) {
    return `${cartStore.totalAmount.toLocaleString('ru-RU')} ₽`
  }
  return 'Корзина'
})

const openCartModal = () => {
  desktopModalStore.openModal({
    component: CartComponent,
    headerTitle: 'Корзина',
  })
}
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
