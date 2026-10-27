<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { formatAddress } from '@/modules/shared/utils/address'
import { useFulfillmentStore } from '../stores/fulfillment.store'
import { useFulfillmentFlowStore } from '../stores/fulfillmentFlow.store'

const { t } = useI18n()
const branchStore = useBranchStore()
const fulfillmentStore = useFulfillmentStore()
const flowStore = useFulfillmentFlowStore()

const summary = computed(() => {
  const choice = fulfillmentStore.current
  if (!choice) return null
  if (choice.type === 'pickup') {
    return {
      icon: 'pi-shopping-bag',
      title: t('order.form.pickup'),
      text: branchStore.activeBranch?.branch_info?.address ?? branchStore.activeBranch?.name,
    }
  }
  return {
    icon: 'pi-car',
    title: t('order.form.delivery'),
    text: [formatAddress(choice.address), choice.address.comment].filter(Boolean).join(' · '),
  }
})
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm"
  >
    <i class="pi text-primary" :class="summary?.icon ?? 'pi-map-marker'" />
    <span class="min-w-0 flex-1">
      <span class="block font-semibold text-gray-900">
        {{ summary?.title ?? t('fulfillment.summary.empty') }}
      </span>
      <span v-if="summary?.text" class="block text-gray-500">{{ summary.text }}</span>
    </span>
    <button
      type="button"
      class="shrink-0 font-semibold text-primary cursor-pointer"
      @click="flowStore.openPicker(fulfillmentStore.current?.type ?? 'delivery')"
    >
      {{ summary ? t('branch.change') : t('fulfillment.summary.choose') }}
    </button>
  </div>
</template>
