<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import Dialog from 'primevue/dialog'
import { useI18n } from 'vue-i18n'
import OptionChips from '@/modules/order/components/OptionChips.vue'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'
import { useFulfillmentFlowStore, type PickerMode } from '../stores/fulfillmentFlow.store'

const DeliveryPane = defineAsyncComponent(() => import('./delivery/DeliveryPane.vue'))
const PickupPane = defineAsyncComponent(() => import('./pickup/PickupPane.vue'))

const { t } = useI18n()
const viewportStore = useViewportStore()
const flowStore = useFulfillmentFlowStore()

const modes = computed<Array<{ value: PickerMode; label: string; icon: string }>>(() => [
  { value: 'delivery', label: t('order.form.delivery'), icon: 'pi-car' },
  { value: 'pickup', label: t('order.form.pickup'), icon: 'pi-shopping-bag' },
])
</script>

<template>
  <Dialog
    v-model:visible="flowStore.isPickerOpen"
    modal
    :header="t('fulfillment.picker.title')"
    :class="
      viewportStore.isMobile
        ? 'm-0! h-dvh! max-h-dvh! w-screen rounded-none!'
        : 'h-[46rem] max-h-[90vh] w-[52rem] max-w-[95vw]'
    "
    content-class="flex flex-col p-0! flex-1 min-h-0"
    @hide="flowStore.dismiss"
  >
    <div class="px-4 pb-3">
      <OptionChips v-model="flowStore.pickerMode" :options="modes" :columns="2" />
    </div>
    <div class="min-h-0 flex-1">
      <DeliveryPane v-if="flowStore.pickerMode === 'delivery'" />
      <PickupPane v-else />
    </div>
  </Dialog>
</template>
