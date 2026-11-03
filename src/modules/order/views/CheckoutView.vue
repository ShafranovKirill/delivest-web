<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Message from 'primevue/message'

import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useOrderStore } from '../stores/order.store'
import { useOpenCart } from '@/modules/cart/composables/useOpenCart'
import OrderForm from '../components/OrderForm.vue'
import OrderComposition from '../components/OrderComposition.vue'
import OrderSuccess from '../components/OrderSuccess.vue'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'
import SkeletonList from '@/modules/shared/components/ui/SkeletonList.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const openCart = useOpenCart()
const cartStore = useCartStore()
const branchStore = useBranchStore()
const orderStore = useOrderStore()
const { t } = useI18n()

const step = computed(() => Number(orderStore.activeStep))

function jumpToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

onMounted(async () => {
  jumpToTop()
  if (route.params.orderId) {
    await orderStore.loadOrder(String(route.params.orderId))
    return
  }
  orderStore.resetOrderState()
  try {
    await cartStore.fetchCart(branchStore.activeBranch?.id, true)
  } catch (e) {
    console.error(e)
  }
})

watch(
  () => [route.params.slug, route.params.orderId],
  async ([slug, id], [oldSlug]) => {
    if (slug !== oldSlug) orderStore.resetOrderState()
    if (id) await orderStore.loadOrder(String(id))
    else orderStore.resetOrderState()
  },
)
onUnmounted(() => orderStore.resetOrderState())

async function submitOrder(form: Parameters<typeof orderStore.createOrder>[0]) {
  const order = await orderStore.createOrder(form)
  if (order) {
    await router.replace({
      name: 'order-confirmation',
      params: { slug: route.params.slug, orderId: order.id },
    })
  }
}

watch(() => orderStore.activeStep, jumpToTop, { flush: 'post' })
watch(
  () => orderStore.createdOrderId,
  (id) => {
    if (id) {
      try {
        sessionStorage.removeItem('checkout-draft')
      } catch {
        // Checkout remains available when storage is unavailable.
      }
    }
  },
)
</script>

<template>
  <PageShell width="wide">
    <Message
      v-if="orderStore.errorMessage"
      severity="error"
      class="mb-4 rounded-2xl!"
      :closable="false"
    >
      {{ orderStore.errorMessage }}
    </Message>

    <SkeletonList
      v-if="
        (cartStore.isLoading && !cartStore.isInitialized && !route.params.orderId) ||
        (route.params.orderId && orderStore.isLoading)
      "
      class="flex flex-col gap-3 sm:gap-4"
      item-class="h-40 rounded-3xl!"
    />

    <EmptyState
      v-else-if="route.params.orderId && step !== 3"
      icon="pi-exclamation-circle"
      :title="t('order.success.loadFailed')"
      :text="t('order.success.loadFailedHint')"
    >
      <Button
        :label="t('common.callUs')"
        rounded
        @click="router.push({ name: 'contacts', params: { slug: route.params.slug } })"
      />
    </EmptyState>

    <EmptyState
      v-else-if="cartStore.isEmpty && step !== 3"
      icon="pi-shopping-cart"
      :title="t('cart.empty')"
      :text="t('cart.emptyHint')"
    >
      <Button :label="t('cart.toMenu')" rounded @click="router.push('/')" />
    </EmptyState>

    <div
      v-else-if="step !== 3"
      class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-3 sm:gap-4 items-start"
    >
      <OrderForm :isLoading="orderStore.isLoading" @submit="submitOrder" @back="openCart" />
      <aside class="hidden lg:block sticky top-28">
        <OrderComposition />
      </aside>
    </div>

    <OrderSuccess v-else />
  </PageShell>
</template>
