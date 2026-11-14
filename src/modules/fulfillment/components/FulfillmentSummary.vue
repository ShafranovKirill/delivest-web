<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { formatAddress } from '@/modules/shared/utils/address'
import { useFulfillmentStore } from '../stores/fulfillment.store'
import { useFulfillmentFlowStore } from '../stores/fulfillmentFlow.store'
import { useDeliveryQuote } from '../composables/useDeliveryQuote'
import FulfillmentIllustration from './FulfillmentIllustration.vue'

const { t } = useI18n()
const branchStore = useBranchStore()
const fulfillmentStore = useFulfillmentStore()
const flowStore = useFulfillmentFlowStore()
const props = defineProps<{ withQuote?: boolean }>()

const { hint, blocked } = useDeliveryQuote()

const summary = computed(() => {
  const choice = fulfillmentStore.current
  if (!choice) return null
  if (choice.type === 'pickup') {
    return {
      illustration: 'pickup' as const,
      title: t(
        choice.pickupKind === 'dine_in' ||
          (!choice.pickupKind && !fulfillmentStore.methods.includes('pickup'))
          ? 'order.form.dineIn'
          : 'order.form.pickup',
      ),
      text: branchStore.activeBranch?.branch_info?.address ?? branchStore.activeBranch?.name,
    }
  }
  return {
    illustration: 'delivery' as const,
    title: t('order.form.delivery'),
    text: fulfillmentStore.addressByOperator
      ? t('order.addressByOperator')
      : choice.address
        ? [formatAddress(choice.address), choice.address.comment].filter(Boolean).join(' · ')
        : '',
  }
})
</script>

<template>
  <button
    type="button"
    class="fulfillment-summary relative isolate block min-h-28 w-full cursor-pointer overflow-hidden rounded-3xl p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong sm:min-h-32 sm:p-5"
    @click="flowStore.openPicker(fulfillmentStore.current?.type ?? 'delivery')"
  >
    <span class="relative z-10 block min-w-0 pr-[clamp(7rem,35%,14rem)]">
      <span class="block text-sm font-medium text-primary-strong">
        {{ summary?.title ?? t('fulfillment.summary.empty') }}
      </span>
      <span
        v-if="summary?.text"
        class="mt-1 block break-words text-base font-semibold leading-snug text-gray-900 sm:text-lg"
        >{{ summary.text }}</span
      >
      <span
        v-if="props.withQuote && fulfillmentStore.current?.type === 'delivery' && hint"
        class="block font-medium"
        :class="blocked ? 'text-red-500' : 'text-gray-700'"
      >
        {{ hint }}
      </span>
    </span>
    <span class="absolute right-4 top-4 z-20 text-sm font-semibold text-primary-strong sm:right-5 sm:top-5">
      {{ summary ? t('branch.change') : t('fulfillment.summary.choose') }}
    </span>
    <FulfillmentIllustration
      :kind="summary?.illustration ?? 'delivery'"
      class="pointer-events-none absolute bottom-1 right-2 z-0 h-16 w-[clamp(7rem,34%,13rem)] text-primary-strong sm:bottom-2 sm:right-4 sm:h-20"
      aria-hidden="true"
    />
  </button>
</template>

<style scoped>
.fulfillment-summary {
  --summary-bg: color-mix(in srgb, var(--color-primary) 14%, var(--surface-card, white));
  background: var(--summary-bg);
}
</style>
