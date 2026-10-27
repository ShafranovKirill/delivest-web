<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import Dialog from 'primevue/dialog'
import { useI18n } from 'vue-i18n'
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
  <Dialog
    v-model:visible="flowStore.isPickerOpen"
    modal
    :show-header="false"
    class="m-0! h-dvh! max-h-dvh! w-screen max-w-none! rounded-none!"
    content-class="relative flex flex-col p-0! flex-1 min-h-0"
    @hide="flowStore.dismiss"
  >
    <button
      type="button"
      :aria-label="t('common.close')"
      class="absolute left-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-white text-gray-700 shadow-lg ring-1 ring-black/10 hover:bg-gray-50 dark:ring-white/10 cursor-pointer"
      @click="flowStore.isPickerOpen = false"
    >
      <i class="pi pi-times text-lg" />
    </button>
    <ModeSwitch
      v-model="flowStore.pickerMode"
      :options="modes"
      class="absolute left-16 right-3 top-3 z-10 mx-auto max-w-xl"
    />
    <div class="min-h-0 flex-1">
      <DeliveryPane v-if="flowStore.pickerMode === 'delivery'" />
      <PickupPane v-else />
    </div>
  </Dialog>
</template>
