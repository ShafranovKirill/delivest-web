<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import MapDialog from './MapDialog.vue'
import ModeSwitch from './ModeSwitch.vue'
import PaneSkeleton from './PaneSkeleton.vue'
import { useFulfillmentFlowStore, type PickerMode } from '../stores/fulfillmentFlow.store'
import { usePrefetchPanes } from '../composables/usePrefetchPanes'
import { loadDeliveryPane, loadPickupPane } from '../utils/panes'

const asyncPane = (loader: typeof loadDeliveryPane | typeof loadPickupPane) =>
  defineAsyncComponent({ loader, loadingComponent: PaneSkeleton, delay: 0 })

const DeliveryPane = asyncPane(loadDeliveryPane)
const PickupPane = asyncPane(loadPickupPane)

const { t } = useI18n()
const flowStore = useFulfillmentFlowStore()

usePrefetchPanes()

const modes = computed<Array<{ value: PickerMode; label: string }>>(() => [
  { value: 'delivery', label: t('order.form.delivery') },
  { value: 'pickup', label: t('order.form.pickup') },
])
</script>

<template>
  <MapDialog v-model:visible="flowStore.isPickerOpen" @hide="flowStore.dismiss">
    <template #header>
      <ModeSwitch v-model="flowStore.pickerMode" :options="modes" />
    </template>
    <DeliveryPane v-if="flowStore.pickerMode === 'delivery'" />
    <PickupPane v-else />
  </MapDialog>
</template>
