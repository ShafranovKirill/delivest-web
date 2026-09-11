<script setup lang="ts">
import Button from 'primevue/button'
import CartComponent from '@/modules/cart/components/CartComponent.vue' // Укажите ваш путь к компоненту корзины
import { useDesktopModalStore } from '@/modules/widgets/modal/modal-desktop/stores/modal.store'

const desktopModalStore = useDesktopModalStore()

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
    label="Корзина"
    @click="openCartModal"
  />
</template>
