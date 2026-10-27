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
    content-class="flex flex-col p-0! flex-1 min-h-0"
    @hide="flowStore.dismiss"
  >
    <div class="flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        :aria-label="t('common.close')"
        class="grid size-10 shrink-0 place-items-center rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer"
        @click="flowStore.isPickerOpen = false"
      >
        <i class="pi pi-times text-lg" />
      </button>
      <h2 class="hidden text-lg font-bold text-gray-900 sm:block">
        {{ t('fulfillment.picker.title') }}
      </h2>
      <OptionChips
        v-model="flowStore.pickerMode"
        :options="modes"
        :columns="2"
        class="flex-1 sm:ml-auto sm:max-w-sm sm:flex-none sm:w-full"
      />
    </div>
    <div class="min-h-0 flex-1">
      <DeliveryPane v-if="flowStore.pickerMode === 'delivery'" />
      <PickupPane v-else />
    </div>
  </Dialog>
</template>
