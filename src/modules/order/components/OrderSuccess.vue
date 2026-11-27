<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useContactsStore } from '@/modules/widgets/contacts/stores/constacts.store'
import { useOrderStore } from '../stores/order.store'
import { computed, ref, watch } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useOrderSuccessQuery } from '../composables/useOrderSuccessQuery'
import OrderSuccessHero from './success/OrderSuccessHero.vue'
import OrderSuccessDetails from './success/OrderSuccessDetails.vue'
import { useI18n } from 'vue-i18n'
import { OrderService } from '../api/order.service'
import { formatPrice } from '@/utils/money'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

const router = useRouter()
const contactsStore = useContactsStore()
const orderStore = useOrderStore()
const branchStore = useBranchStore()
const authStore = useAuthStore()
const { t } = useI18n()
const sourceOrder = computed(() => orderStore.lastCreatedOrder)
const liveOrder = useOrderSuccessQuery(sourceOrder)
const order = computed(() => {
  const source = sourceOrder.value
  if (!source || source.branch_id !== branchStore.activeBranch?.id) return null
  return liveOrder.data.value?.id === source.id ? liveOrder.data.value : source
})
const fallbackPending = ref(false)
const fallbackError = ref(false)
async function payWithNewMethod() {
  const current = order.value
  if (!current?.saved_payment_fallback_available || fallbackPending.value) return
  const sessionEpoch = authStore.sessionEpoch
  fallbackPending.value = true
  fallbackError.value = false
  try {
    const url = await OrderService.getPaymentLink(current.id, true)
    if (order.value?.id !== current.id || authStore.sessionEpoch !== sessionEpoch) return
    if (url) window.location.assign(url)
    else await liveOrder.refetch()
  } catch {
    if (order.value?.id === current.id && authStore.sessionEpoch === sessionEpoch)
      fallbackError.value = true
  } finally {
    fallbackPending.value = false
  }
}
watch(
  order,
  (current) => {
    if (!current || current.awaiting_payment || current.status === 'cancelled') return
    try {
      sessionStorage.removeItem('checkout-draft')
    } catch {
      // Checkout remains available when storage is unavailable.
    }
  },
  { immediate: true },
)

function handleReturnHome() {
  orderStore.resetOrderState()
  router.push('/')
}
</script>

<template>
  <div class="mx-auto flex max-w-lg flex-col gap-3 sm:gap-4">
    <OrderSuccessHero v-if="order" :key="order.id" :order="order" />

    <OrderSuccessDetails v-if="order" :order="order" />

    <Button
      v-if="order?.awaiting_payment && order.saved_payment_fallback_available"
      :label="t('order.savedPayment.fallback', { amount: formatPrice(order.total_amount) })"
      :loading="fallbackPending"
      class="h-12 w-full rounded-full! font-semibold"
      @click="payWithNewMethod"
    />
    <p v-if="fallbackError" class="text-center text-sm text-red-600">
      {{ t('order.savedPayment.fallbackFailed') }}
    </p>

    <div class="flex flex-col gap-2 sm:flex-row sm:gap-3">
      <Button
        :label="t('order.success.backToMenu')"
        class="h-14 flex-1 rounded-full! font-semibold sm:order-last"
        @click="handleReturnHome"
      />
      <Button
        v-if="contactsStore.phone"
        as="a"
        :href="`tel:${contactsStore.phone}`"
        :label="t('common.callUs')"
        icon="pi pi-phone"
        severity="secondary"
        class="h-14 flex-1 rounded-full! font-semibold"
      />
    </div>
  </div>
</template>
