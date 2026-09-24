<script setup lang="ts">
import { onMounted } from 'vue'
import CartItemCard from './CartItem.vue'
import { useCartStore } from '../stores/cart.store.ts'
import { useRoute, useRouter } from 'vue-router'
import { useDesktopModalStore } from '@/modules/widgets/modal/modal-desktop/stores/modal.store.ts'
import { useMobileModalStore } from '@/modules/widgets/modal/mobile-modal/stores/modal.store.ts'

const cartStore = useCartStore()
const router = useRouter()
const route = useRoute()

const desktopModalStore = useDesktopModalStore()
const mobileModalStore = useMobileModalStore()

onMounted(() => {
  if (!cartStore.isInitialized) {
    cartStore.fetchCart()
  }
})
function handleCheckout() {
  desktopModalStore.closeModal()
  mobileModalStore.closeModal()

  const slug = route.params.slug
  if (slug) {
    router.push({ name: 'checkout', params: { slug } })
  } else {
    router.push({ name: 'checkout' })
  }
}
</script>

<template>
  <div class="w-full flex flex-col h-full py-3 lg:py-4">
    <div
      v-if="cartStore.isLoading && !cartStore.isInitialized"
      class="py-8 text-center text-sm text-muted-foreground"
    >
      Загрузка корзины...
    </div>

    <div v-else-if="cartStore.isEmpty" class="py-12 text-center text-sm text-muted-foreground">
      Ваша корзина пуста
    </div>

    <div v-else class="flex flex-col h-full justify-between gap-4">
      <div class="flex flex-col gap-3 overflow-y-auto">
        <CartItemCard v-for="item in cartStore.items" :key="item.product_id" :item="item" />
      </div>

      <div class="pt-3 border-t flex flex-col gap-3 mt-auto">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">Товаров в корзине:</span>
          <span class="font-medium">{{ cartStore.totalQuantity }} шт.</span>
        </div>

        <div class="flex items-center justify-between text-base font-semibold">
          <span>Сумма:</span>
          <span>{{ cartStore.totalAmount }} ₽</span>
        </div>

        <button
          type="button"
          @click="handleCheckout"
          :disabled="cartStore.isLoading"
          class="w-full py-3 px-4 rounded-xl bg-(--p-primary-500) text-white font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          К оформлению заказа
        </button>
      </div>
    </div>
  </div>
</template>
