<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import AddressEditor from './AddressEditor.vue'
import DeliveryQuoteSummary from './DeliveryQuoteSummary.vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useFulfillmentStore } from '../../stores/fulfillment.store'
import { useFulfillmentFlowStore } from '../../stores/fulfillmentFlow.store'
import { useDeliveryQuote } from '../../composables/useDeliveryQuote'
import { useDeliveryZones } from '../../composables/useDeliveryZones'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { emptyDeliveryAddress, isComplete, type DeliveryAddress } from '../../utils/deliveryAddress'
import { useFunnelAnalytics } from '@/modules/analytics/useFunnelAnalytics'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { lngLatOf } from '../../utils/deliveryAddress'
import type { AddressNotice } from './addressNotice'

const { t } = useI18n()
const emit = defineEmits<{ mapUnavailable: [] }>()
const branchStore = useBranchStore()
const fulfillmentStore = useFulfillmentStore()
const flowStore = useFulfillmentFlowStore()
const authStore = useAuthStore()
const analytics = useFunnelAnalytics()
const franchiseStore = useFranchiseStore()
const manualMode = computed(() => !branchStore.requiresCoordinates)
const mapRequiredUnavailable = computed(
  () => branchStore.requiresCoordinates && !franchiseStore.addressMap && !lngLatOf(address.value),
)

const city = computed(() => branchStore.activeBranch?.branch_info?.city ?? null)

const address = ref<DeliveryAddress>({
  ...(flowStore.addressDrafts[branchStore.activeBranch?.id ?? ''] ??
    (fulfillmentStore.current?.type === 'delivery' ? fulfillmentStore.current.address : null) ??
    emptyDeliveryAddress()),
})
const missingHouse = computed(
  () => address.value.street.trim().length >= 4 && !address.value.house.trim(),
)
watch(
  [() => authStore.client?.id ?? 'guest', () => branchStore.activeBranch?.id],
  ([, branchId], [previousOwner, previousBranchId]) => {
    if (previousBranchId !== branchId || (previousOwner && previousOwner !== 'guest')) {
      address.value = {
        ...(flowStore.addressDrafts[branchId ?? ''] ??
          (fulfillmentStore.current?.type === 'delivery'
            ? fulfillmentStore.current.address
            : null) ??
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

const delivery = useDeliveryQuote(address, () => !manualMode.value)
const zones = useDeliveryZones(() => !manualMode.value)
const canUseOperator = computed(
  () => branchStore.operatorAddress && fulfillmentStore.methods.includes('delivery'),
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
  if (manualMode.value) {
    if (!isComplete(address.value, branchStore.mapAddress === false)) return
  } else if (!delivery.ready.value || !delivery.quote.value || delivery.notDelivered.value) return

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
    floating-labels
    :selected-zone-id="
      selecting || needsZoom || delivery.pending.value || delivery.isError.value
        ? null
        : delivery.quote.value?.zone_id
    "
    @selecting="startSelecting"
    @zoom-too-low="requireZoom"
    @map-unavailable="emit('mapUnavailable')"
  >
    <template #map-overlay="{ ready, locating, notice }: { ready: boolean; locating: boolean; notice: AddressNotice | null }">
      <DeliveryQuoteSummary
        :notice="notice"
        :quote="selecting || needsZoom ? null : delivery.quote.value"
        :has-point="address.latitude != null && address.longitude != null"
        :missing-house="missingHouse"
        :ready="ready && !locating"
        :pending="delivery.pending.value"
        :selecting="selecting"
        :needs-zoom="needsZoom"
        :error="delivery.isError.value"
        :retry-quote="() => delivery.retry()"
        :subtotal="delivery.subtotal.value"
      />
    </template>
    <template #default="{ ready, locating, onMap, notice }: { ready: boolean; locating: boolean; onMap: boolean; notice: AddressNotice | null }">
      <div class="flex min-w-0 flex-col gap-2" :class="onMap ? 'sm:flex-row sm:items-center' : ''">
        <DeliveryQuoteSummary
          v-if="!onMap && (!manualMode || notice)"
          :notice="notice"
          :quote="selecting || needsZoom ? null : delivery.quote.value"
          :has-point="address.latitude != null && address.longitude != null"
          :missing-house="missingHouse"
          :ready="ready && !locating"
          :pending="delivery.pending.value"
          :selecting="selecting"
          :needs-zoom="needsZoom"
          :error="delivery.isError.value"
          :retry-quote="() => delivery.retry()"
          :subtotal="delivery.subtotal.value"
        />
        <Button
          :label="t('fulfillment.confirmAddress')"
          :disabled="
            !ready ||
            (!manualMode &&
              (locating ||
                selecting ||
                needsZoom ||
                delivery.pending.value ||
                delivery.isError.value ||
                delivery.notDelivered.value ||
                !delivery.quote.value))
          "
          :loading="!manualMode && locating"
          class="h-12! min-h-12! min-w-0 w-full flex-1 rounded-full! px-3! text-sm! font-semibold sm:w-auto"
          @click="confirm"
        />
      </div>
      <p v-if="mapRequiredUnavailable" class="text-sm text-amber-700">
        {{
          t(
            fulfillmentStore.availableModes.includes('pickup')
              ? 'delivery.mapUnavailablePickup'
              : 'delivery.mapUnavailable',
          )
        }}
      </p>
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
