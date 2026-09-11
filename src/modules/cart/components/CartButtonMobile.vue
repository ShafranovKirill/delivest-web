<script setup lang="ts">
import Button from 'primevue/button'
import CartComponent from '@/modules/cart/components/CartComponent.vue'
import { useMobileModalStore } from '@/modules/widgets/modal/mobile-modal/stores/modal.store'

const modalStore = useMobileModalStore()

const openCartModal = () => {
  modalStore.openModal({
    component: CartComponent,
    headerTitle: 'Корзина',
  })
}
</script>

<template>
  <Button rounded class="fixed! bottom-6 right-6 h-15! w-15!" @click="openCartModal">
    <template #icon>
      <i class="pi pi-shopping-bag text-xl!"></i>
    </template>
  </Button>
</template>
