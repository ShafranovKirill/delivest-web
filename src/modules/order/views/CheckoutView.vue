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

const steps = computed(() => [
  { value: 1, label: t('cart.title'), icon: 'pi-shopping-cart' },
  { value: 2, label: t('order.steps.details'), icon: 'pi-user' },
  { value: 3, label: t('order.steps.done'), icon: 'pi-check' },
])

const step = computed(() => Number(orderStore.activeStep))

function canOpen(value: number) {
  if (orderStore.createdOrderId) return value === 3
  if (value === 2) return !cartStore.isEmpty
  return value === 1
}

function goTo(value: number) {
  if (canOpen(value)) orderStore.handleStepChange(value)
}

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
  <PageShell :title="t('order.checkout')" width="default">
    <ol
      class="mb-6 sm:mb-8 grid grid-cols-3 gap-2 rounded-full bg-gray-50 border border-gray-100 p-1.5"
    >
      <li v-for="item in steps" :key="item.value">
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-full px-2 py-2.5 text-sm font-semibold transition-colors"
          :class="[
            step === item.value
              ? 'bg-primary text-white shadow-sm'
              : step > item.value
                ? 'text-primary'
                : 'text-gray-400',
            canOpen(item.value) && step !== item.value
              ? 'cursor-pointer hover:bg-white'
              : 'cursor-default',
          ]"
          :disabled="!canOpen(item.value)"
          :aria-current="step === item.value ? 'step' : undefined"
          @click="goTo(item.value)"
        >
          <i :class="['pi', step > item.value ? 'pi-check-circle' : item.icon, 'text-sm']" />
          <span>{{ item.label }}</span>
        </button>
      </li>
    </ol>

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
      <OrderForm :isLoading="orderStore.isLoading" @submit="orderStore.createOrder" />
      <aside class="hidden lg:block sticky top-28">
        <OrderSummary compact />
      </aside>
    </div>

    <OrderSuccess v-else />
  </PageShell>
</template>
