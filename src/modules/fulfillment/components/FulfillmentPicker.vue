<script setup lang="ts">
import { computed, defineAsyncComponent, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFulfillmentStore } from '../stores/fulfillment.store'
import MapDialog from './MapDialog.vue'
import ModeSwitch from './ModeSwitch.vue'
import PaneSkeleton from './PaneSkeleton.vue'
import { useFulfillmentFlowStore, type PickerMode } from '../stores/fulfillmentFlow.store'
import { loadDeliveryPane, loadPickupPane } from '../utils/panes'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'

const asyncPane = (loader: typeof loadDeliveryPane | typeof loadPickupPane) =>
  defineAsyncComponent({ loader, loadingComponent: PaneSkeleton, delay: 0 })

const DeliveryPane = asyncPane(loadDeliveryPane)
const PickupPane = asyncPane(loadPickupPane)

const { t } = useI18n()
const flowStore = useFulfillmentFlowStore()
const fulfillment = useFulfillmentStore()
const branchStore = useBranchStore()
const franchiseStore = useFranchiseStore()
const hasMap = computed(
  () => franchiseStore.addressMap && (flowStore.pickerMode !== 'delivery' || branchStore.mapAddress),
)

const modes = computed<Array<{ value: PickerMode; label: string }>>(() =>
  fulfillment.availableModes.map((value) => ({
    value,
    label: t(
      value === 'delivery'
        ? 'order.form.delivery'
        : fulfillment.methods.includes('pickup')
          ? 'order.form.pickup'
          : 'order.form.dineIn',
    ),
  })),
)
watch(modes, (options) => {
  if (!options.length) flowStore.abandon()
  else if (!options.some((option) => option.value === flowStore.pickerMode))
    flowStore.pickerMode = options[0]!.value
})
</script>

<template>
  <MapDialog v-model:visible="flowStore.isPickerOpen" :compact="!hasMap" @hide="flowStore.dismiss">
    <template #header>
      <ModeSwitch v-if="modes.length > 1" v-model="flowStore.pickerMode" :options="modes" />
      <span v-else class="font-semibold">{{ modes[0]?.label }}</span>
    </template>
    <DeliveryPane v-if="flowStore.isPickerOpen && flowStore.pickerMode === 'delivery'" />
    <PickupPane
      v-else-if="flowStore.isPickerOpen && flowStore.pickerMode === 'pickup' && modes.length"
    />
  </MapDialog>
</template>
