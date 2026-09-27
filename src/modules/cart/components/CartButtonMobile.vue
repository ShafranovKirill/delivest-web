<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import CartComponent from '@/modules/cart/components/CartComponent.vue'
import { useMobileModalStore } from '@/modules/widgets/modal/mobile-modal/stores/modal.store'
import { useCartStore } from '@/modules/cart/stores/cart.store'

const modalStore = useMobileModalStore()
const cartStore = useCartStore()

const formattedTotal = computed(() => {
  return `${cartStore.totalAmount.toLocaleString('ru-RU')} ₽`
})

const openCartModal = () => {
  modalStore.openModal({
    component: CartComponent,
    headerTitle: 'Корзина',
  })
}
</script>

<template>
  <Button
    v-if="!cartStore.isEmpty"
    class="fixed! bottom-6 right-6 h-15! w-auto! shrink-0 rounded-full! px-6! min-w-max flex! items-center justify-center gap-2!"
    @click="openCartModal"
  >
    <i class="pi pi-shopping-bag text-xl! shrink-0"></i>
    <span class="font-medium whitespace-nowrap text-base">{{ formattedTotal }}</span>
  </Button>
</template>
