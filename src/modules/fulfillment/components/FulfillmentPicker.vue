<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import Dialog from 'primevue/dialog'
import { useI18n } from 'vue-i18n'
import OptionChips from '@/modules/order/components/OptionChips.vue'
import { useFulfillmentFlowStore, type PickerMode } from '../stores/fulfillmentFlow.store'

const DeliveryPane = defineAsyncComponent(() => import('./delivery/DeliveryPane.vue'))
const PickupPane = defineAsyncComponent(() => import('./pickup/PickupPane.vue'))

const { t } = useI18n()
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
    :show-header="false"
    class="m-0! h-dvh! max-h-dvh! w-screen max-w-none! rounded-none!"
    content-class="relative flex flex-col p-0! flex-1 min-h-0"
    @hide="flowStore.dismiss"
  >
    <button
      type="button"
      :aria-label="t('common.close')"
      class="absolute left-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-white text-gray-700 shadow-md hover:bg-gray-50 cursor-pointer"
      @click="flowStore.isPickerOpen = false"
    >
      <i class="pi pi-times text-lg" />
    </button>
    <div
      class="absolute left-1/2 top-3 z-10 w-[min(20rem,calc(100%-8rem))] -translate-x-1/2 rounded-3xl bg-white p-1 shadow-md"
    >
      <OptionChips v-model="flowStore.pickerMode" :options="modes" :columns="2" />
    </div>
    <div class="min-h-0 flex-1">
      <DeliveryPane v-if="flowStore.pickerMode === 'delivery'" />
      <PickupPane v-else />
    </div>
  </Dialog>
</template>
