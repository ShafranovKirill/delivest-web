<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import Message from 'primevue/message'

import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useOrderStore } from '../stores/order.store'
import OrderForm from '../components/OrderForm.vue'
import OrderSummary from '../components/OrderSummary.vue'
import OrderSuccess from '../components/OrderSuccess.vue'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'
import SkeletonList from '@/modules/shared/components/ui/SkeletonList.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
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
  try {
    await cartStore.fetchCart(branchStore.activeBranch?.id, true)
  } catch (e) {
    console.error(e)
  }
})

watch(() => orderStore.activeStep, jumpToTop, { flush: 'post' })

onBeforeRouteLeave(() => {
  if (orderStore.createdOrderId) orderStore.clearCreatedOrder()
})

onUnmounted(() => {
  if (orderStore.createdOrderId) orderStore.clearCreatedOrder()
})
</script>

<template>
  <PageShell width="default">
    <Message
      v-if="orderStore.errorMessage"
      severity="error"
      class="mb-4 rounded-2xl!"
      :closable="false"
    >
      {{ orderStore.errorMessage }}
    </Message>

    <SkeletonList
      v-if="cartStore.isLoading && !cartStore.isInitialized"
      class="flex flex-col gap-3 sm:gap-4"
      item-class="h-40 rounded-3xl!"
    />

    <EmptyState
      v-else-if="cartStore.isEmpty && step !== 3"
      icon="pi-shopping-cart"
      :title="t('cart.empty')"
      :text="t('cart.emptyHint')"
    >
      <Button :label="t('cart.toMenu')" rounded @click="router.push('/')" />
    </EmptyState>

    <div v-else-if="step === 1" class="mx-auto max-w-2xl">
      <OrderSummary @next="orderStore.handleStepChange(2)" />
    </div>

    <div
      v-else-if="step === 2"
      class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-3 sm:gap-4 items-start"
    >
      <OrderForm
        :isLoading="orderStore.isLoading"
        @submit="orderStore.createOrder"
        @back="orderStore.handleStepChange(1)"
      />
      <aside class="hidden lg:block sticky top-28">
        <OrderSummary compact />
      </aside>
    </div>

    <OrderSuccess v-else />
  </PageShell>
</template>
