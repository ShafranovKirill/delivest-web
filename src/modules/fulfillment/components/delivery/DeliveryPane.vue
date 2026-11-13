<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import AddressEditor from './AddressEditor.vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useFulfillmentStore } from '../../stores/fulfillment.store'
import { useFulfillmentFlowStore } from '../../stores/fulfillmentFlow.store'
import { useDeliveryQuote } from '../../composables/useDeliveryQuote'
import { useDeliveryZones } from '../../composables/useDeliveryZones'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { emptyDeliveryAddress, type DeliveryAddress } from '../../utils/deliveryAddress'
import { formatPrice } from '@/utils/money'
import { useFunnelAnalytics } from '@/modules/analytics/useFunnelAnalytics'

const { t } = useI18n()
const branchStore = useBranchStore()
const fulfillmentStore = useFulfillmentStore()
const flowStore = useFulfillmentFlowStore()
const authStore = useAuthStore()
const analytics = useFunnelAnalytics()

const city = computed(() => branchStore.activeBranch?.branch_info?.city ?? null)

const address = ref<DeliveryAddress>({
  ...(flowStore.addressDrafts[branchStore.activeBranch?.id ?? ''] ??
    (fulfillmentStore.current?.type === 'delivery' ? fulfillmentStore.current.address : null) ??
    emptyDeliveryAddress()),
})
watch(
  [() => authStore.client?.id ?? 'guest', () => branchStore.activeBranch?.id],
  ([, branchId], [previousOwner, previousBranchId]) => {
    if (previousBranchId !== branchId || (previousOwner && previousOwner !== 'guest')) {
      address.value = {
        ...(flowStore.addressDrafts[branchId ?? ''] ??
          (fulfillmentStore.current?.type === 'delivery' ? fulfillmentStore.current.address : null) ??
          emptyDeliveryAddress()),
      }
    }
  },
  { flush: 'sync' },
)

watch(
  address,
  (value) => {
    const branchId = branchStore.activeBranch?.id
    if (branchId) flowStore.saveAddressDraft(branchId, value)
  },
  { deep: true },
)

const delivery = useDeliveryQuote(address)
const zones = useDeliveryZones()
const canUseOperator = computed(() =>
  branchStore.operatorAddress && fulfillmentStore.methods.includes('delivery'),
)
const selecting = ref(false)
const needsZoom = ref(false)

watch(
  address,
  () => {
    selecting.value = false
    needsZoom.value = false
  },
  { flush: 'sync' },
)

const quoteCaption = computed(() => {
  if (needsZoom.value) return t('delivery.zoomIn')
  if (selecting.value || delivery.pending.value) return t('delivery.checking')
  if (delivery.isError.value) return t('delivery.unavailable')
  const quote = delivery.quote.value
  if (!quote) return t('delivery.checking')
  const zone = quote.zone_name ? `${quote.zone_name} · ` : ''
  if (quote.status !== 'ok' && quote.status !== 'below_minimum')
    return zone + (delivery.hint.value ?? '')
  const details =
    quote.status === 'below_minimum'
      ? [
          quote.price
            ? t('delivery.price', { price: formatPrice(quote.price) })
            : t('delivery.free'),
          delivery.hint.value ?? '',
        ]
      : [delivery.hint.value ?? '']
  if (quote.status === 'ok' && quote.min_order != null && quote.min_order > 0)
    details.push(t('delivery.zoneMinimum', { sum: formatPrice(quote.min_order) }))
  if (quote.free_from != null && quote.free_from > 0 && (quote.status !== 'ok' || !quote.price))
    details.push(t('delivery.freeFrom', { sum: formatPrice(quote.free_from) }))
  if (quote.minutes != null) details.push(t('delivery.zoneMinutes', { minutes: quote.minutes }))
  return zone + details.join(' · ')
})

const pinNote = computed(() => {
  if (needsZoom.value || selecting.value || delivery.pending.value || delivery.isError.value)
    return null
  const quote = delivery.quote.value
  if (quote?.status !== 'ok') return null
  return quote.price ? t('delivery.price', { price: formatPrice(quote.price) }) : t('delivery.free')
})

function startSelecting() {
  selecting.value = true
  needsZoom.value = false
}

function requireZoom() {
  selecting.value = false
  needsZoom.value = true
}

function confirm() {
  const branchId = branchStore.activeBranch?.id
  if (!branchId) return

  fulfillmentStore.choose(branchId, { type: 'delivery', address: { ...address.value } })
  analytics.track('fulfillment_selected')
  flowStore.clearAddressDraft(branchId)
  flowStore.complete()
}

function confirmWithOperator() {
  const branchId = branchStore.activeBranch?.id
  if (!branchId || !canUseOperator.value) return
  const existing = fulfillmentStore.current
  fulfillmentStore.choose(branchId, {
    type: 'delivery',
    address: existing?.type === 'delivery' ? existing.address : null,
    addressByOperator: true,
  })
  analytics.track('fulfillment_selected')
  flowStore.clearAddressDraft(branchId)
  flowStore.complete()
}
</script>

<template>
  <AddressEditor
    v-model="address"
    :city="city"
    :zones="zones"
    :pin-note="pinNote"
    :selected-zone-id="
      selecting || needsZoom || delivery.pending.value || delivery.isError.value
        ? null
        : delivery.quote.value?.zone_id
    "
    @selecting="startSelecting"
    @zoom-too-low="requireZoom"
  >
    <template #default="{ ready, locating }">
      <p
        v-if="
          ready ||
          (address.latitude != null && address.longitude != null) ||
          needsZoom ||
          selecting ||
          locating
        "
        data-testid="delivery-quote-caption"
        class="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-medium"
        :class="
          delivery.quote.value?.status === 'below_minimum' ||
          delivery.notDelivered.value ||
          delivery.isError.value
            ? 'text-red-500'
            : 'text-gray-700'
        "
      >
        {{ quoteCaption }}
      </p>
      <Button
        :label="t('fulfillment.confirmAddress')"
        :disabled="
          !ready ||
          locating ||
          selecting ||
          needsZoom ||
          delivery.pending.value ||
          delivery.isError.value ||
          delivery.notDelivered.value ||
          !delivery.quote.value
        "
        :loading="locating"
        class="h-12 w-full rounded-full! font-semibold"
        @click="confirm"
      />
      <Button
        v-if="canUseOperator"
        :label="t('fulfillment.tellOperator')"
        variant="text"
        severity="secondary"
        class="h-10! w-full rounded-full! bg-transparent! p-0! text-sm! font-medium!"
        @click="confirmWithOperator"
      />
    </template>
  </AddressEditor>
</template>
