<script setup lang="ts">
import { onMounted } from 'vue'
import CartItemCard from './CartItem.vue'
import CartPromotions from './CartPromotions.vue'
import CartTotals from './CartTotals.vue'
import PromoCodeInput from './PromoCodeInput.vue'
import { useCartStore } from '../stores/cart.store.ts'
import { useRoute, useRouter } from 'vue-router'
import { useDesktopModalStore } from '@/modules/widgets/modal/desktop-modal/stores/modal.store.ts'
import { useMobileModalStore } from '@/modules/widgets/modal/mobile-modal/stores/modal.store.ts'
import { useI18n } from 'vue-i18n'

const cartStore = useCartStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

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

function goToCatalog() {
  desktopModalStore.closeModal()
  mobileModalStore.closeModal()

  const slug = route.params.slug
  if (slug) {
    router.push({ name: 'catalog', params: { slug } })
  } else {
    router.push({ name: 'catalog' })
  }
}
</script>

<template>
  <div class="w-full h-full min-h-0 flex flex-col overflow-hidden bg-white">
    <div
      v-if="cartStore.isLoading && !cartStore.isInitialized"
      class="p-6 text-center text-sm text-muted-foreground my-auto"
    >
      {{ t('cart.loading') }}
    </div>

    <div
      v-else-if="cartStore.isEmpty"
      class="flex flex-col items-center justify-center h-full my-auto py-12 px-6 text-center"
    >
      <div
        class="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground"
      >
        <i class="pi pi-shopping-cart text-2xl"></i>
      </div>

      <h3 class="text-base font-semibold text-foreground mb-1">
        {{ t('errors.codes.cart_is_empty') }}
      </h3>

      <p class="text-sm text-muted-foreground max-w-xs mb-6">
        {{ t('cart.emptyText') }}
      </p>

      <button
        type="button"
        @click="goToCatalog"
        class="py-2.5 px-5 rounded-xl bg-(--p-primary-500) text-white font-medium text-sm transition-opacity hover:opacity-90"
      >
        {{ t('cart.toCatalog') }}
      </button>
    </div>

    <template v-else>
      <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-1">
        <div class="flex flex-col gap-3">
          <CartItemCard v-for="item in cartStore.items" :key="item.key" :item="item" />
        </div>

        <div class="pt-4 pb-2 mt-auto border-t flex flex-col gap-3">
          <CartPromotions />
          <PromoCodeInput />
          <CartTotals />
        </div>
      </div>

      <div class="pt-3 pb-[calc(env(safe-area-inset-bottom))] bg-white z-20">
        <button
          type="button"
          @click="handleCheckout"
          :disabled="cartStore.isLoading"
          class="w-full py-3.5 px-4 rounded-2xl bg-(--p-primary-500) text-white font-medium text-base transition-opacity hover:opacity-90 disabled:opacity-50 shadow-sm"
        >
          {{ t('cart.checkout') }}
        </button>
      </div>
    </template>
  </div>
</template>
