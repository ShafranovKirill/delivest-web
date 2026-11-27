<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Message from 'primevue/message'

import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useOrderStore } from '../stores/order.store'
import { useReturnToCart } from '@/modules/cart/composables/useReturnToCart'
import OrderForm from '../components/OrderForm.vue'
import OrderComposition from '../components/OrderComposition.vue'
import OrderSuccess from '../components/OrderSuccess.vue'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'
import SkeletonList from '@/modules/shared/components/ui/SkeletonList.vue'
import { useI18n } from 'vue-i18n'
import { useFunnelAnalytics } from '@/modules/analytics/useFunnelAnalytics'
import { pendingPrivateSession } from '@/api/storefront'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { getApiErrorCode, getApiErrorMessage } from '@/api/errors'

const router = useRouter()
const route = useRoute()
const returnToCart = useReturnToCart()
const cartStore = useCartStore()
const branchStore = useBranchStore()
const authStore = useAuthStore()
const orderStore = useOrderStore()
const { t } = useI18n()
const analytics = useFunnelAnalytics()
const resetSavedPaymentKey = ref(0)
watch(
  () => [
    route.name,
    branchStore.activeBranch?.id,
    branchStore.activeBranch?.branch_info?.analytics_funnel_enabled,
  ],
  ([name, branchId]) => {
    if (name === 'checkout' && branchId) analytics.track('checkout_start')
  },
  { immediate: true },
)

const step = computed(() => Number(orderStore.activeStep))
const unavailableCombos = computed(() =>
  cartStore.items.filter((item) => item.unavailable_reason === 'combo_requires_delivest'),
)

async function removeCombo(key: string) {
  const path = route.fullPath
  try {
    await cartStore.removeAllOfItem(key)
    if (route.fullPath === path) orderStore.errorMessage = null
  } catch (error) {
    if (route.fullPath === path) orderStore.errorMessage = getApiErrorMessage(error)
  }
}

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
    const pending = pendingPrivateSession(
      branchStore.activeBranch?.id ?? '',
      authStore.sessionEpoch,
    )
    if (pending) await pending.catch(() => undefined)
    if (!cartStore.hasFreshCart()) await cartStore.fetchCart(branchStore.activeBranch?.id, true)
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
  const checkoutPath = route.fullPath
  const slug = route.params.slug
  let order
  try {
    order = await orderStore.createOrder(form)
  } catch (error) {
    if (
      form.saved_payment_method_id &&
      [
        'saved_payment_methods_disabled',
        'saved_payment_method_not_found',
        'saved_payment_method_conflict',
      ].includes(getApiErrorCode(error) ?? '')
    )
      resetSavedPaymentKey.value++
    return
  }
  if (order && route.fullPath === checkoutPath) {
    await router.replace({
      name: 'order-confirmation',
      params: { slug, orderId: order.id },
    })
    if (order.payment?.confirmation_url) window.location.assign(order.payment.confirmation_url)
  }
}

watch(() => orderStore.activeStep, jumpToTop, { flush: 'post' })
watch(
  () => orderStore.lastCreatedOrder,
  (order) => {
    if (!order || order.awaiting_payment) return
    try {
      sessionStorage.removeItem('checkout-draft')
    } catch {
      // Checkout remains available when storage is unavailable.
    }
  },
)
</script>

<template>
  <PageShell>
    <Message
      v-if="orderStore.errorMessage"
      severity="error"
      class="mb-4 rounded-2xl!"
      :closable="false"
    >
      {{ orderStore.errorMessage }}
    </Message>

    <section
      v-if="step !== 3 && unavailableCombos.length"
      class="mb-4 space-y-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800"
      aria-live="polite"
    >
      <p>{{ t('cart.comboRequiresDelivest') }}</p>
      <ul class="space-y-1">
        <li
          v-for="item in unavailableCombos"
          :key="item.key"
          class="flex items-center justify-between gap-3"
        >
          <span>{{ item.name }}</span>
          <button
            type="button"
            class="shrink-0 rounded-lg px-2 py-1 font-semibold underline disabled:opacity-50"
            :aria-label="t('cart.removeCombo', { name: item.name })"
            :disabled="cartStore.isLoading"
            @click="removeCombo(item.key)"
          >
            {{ t('cart.removeShort') }}
          </button>
        </li>
      </ul>
    </section>

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
      class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_auto] gap-3 sm:gap-4 lg:gap-y-6 items-start"
    >
      <OrderForm
        :is-loading="orderStore.isLoading"
        :cart-blocked="unavailableCombos.length > 0"
        :reset-saved-payment-key="resetSavedPaymentKey"
        @submit="submitOrder"
        @back="returnToCart"
      />
      <aside class="hidden lg:col-start-2 lg:row-start-2 lg:block lg:self-start sticky top-28">
        <OrderComposition />
      </aside>
    </div>

    <OrderSuccess v-else />
  </PageShell>
</template>
