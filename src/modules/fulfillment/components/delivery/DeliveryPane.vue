<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import AddressEditor from './AddressEditor.vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useFulfillmentStore } from '../../stores/fulfillment.store'
import { useFulfillmentFlowStore } from '../../stores/fulfillmentFlow.store'
import { useDeliveryQuote } from '../../composables/useDeliveryQuote'
import { emptyDeliveryAddress, type DeliveryAddress } from '../../utils/deliveryAddress'

const { t } = useI18n()
const branchStore = useBranchStore()
const fulfillmentStore = useFulfillmentStore()
const flowStore = useFulfillmentFlowStore()

const city = computed(() => branchStore.activeBranch?.branch_info?.city ?? null)

const address = ref<DeliveryAddress>({
  ...(fulfillmentStore.deliveryAddress ?? emptyDeliveryAddress(city.value ?? '')),
})

const delivery = useDeliveryQuote(address)

function confirm() {
  const branchId = branchStore.activeBranch?.id
  if (!branchId) return

  fulfillmentStore.choose(branchId, { type: 'delivery', address: { ...address.value } })
  flowStore.complete()
}
</script>

<template>
  <AddressEditor v-model="address" :city="city">
    <template #default="{ ready, locating }">
      <p
        v-if="ready && delivery.hint.value"
        class="text-sm font-medium"
        :class="delivery.blocked.value ? 'text-red-500' : 'text-gray-600'"
      >
        {{ delivery.hint.value }}
      </p>
      <Button
        :label="t('fulfillment.deliverHere')"
        :disabled="!ready || delivery.notDelivered.value"
        :loading="locating"
        class="h-12 w-full rounded-full! font-semibold"
        @click="confirm"
      />
    </template>
  </AddressEditor>
</template>
