<script setup lang="ts">
import type { ActiveOrder } from '../../api/order.service'
import { formatPrice } from '@/utils/money'
import { formatTime, fulfillmentLabel, orderStatusLabel } from '../../utils/orderStatus'
import OrderStatusSteps from './OrderStatusSteps.vue'
import OrderStatusIllustration from './OrderStatusIllustration.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ order: ActiveOrder }>()
defineEmits<{ open: [order: ActiveOrder] }>()

const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="order-status-card group relative isolate block min-h-44 w-full cursor-pointer overflow-hidden rounded-3xl bg-white p-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
    @click="$emit('open', order)"
  >
    <span class="relative z-10 block w-[65%] min-w-0">
      <span class="block text-xs leading-snug text-gray-500">
        {{ t('order.number', { number: order.short_number }) }} ·
        {{ fulfillmentLabel(order.fulfillment_type) }}
      </span>
      <span
        class="mt-2 block break-words text-lg font-bold leading-tight text-gray-950 sm:text-2xl"
      >
        {{ orderStatusLabel(order) }}
      </span>
      <span class="mt-4 block max-w-52">
        <OrderStatusSteps :order="order" />
      </span>
      <span class="mt-3 block text-sm leading-snug text-gray-500">
        {{
          order.cook_by
            ? t('order.cookBy', { time: formatTime(order.cook_by) })
            : t('order.placedAt', { time: formatTime(order.inserted_at) })
        }}
      </span>
      <span class="mt-1 block font-semibold tabular-nums text-gray-900">
        {{ formatPrice(order.total_amount) }}
      </span>
    </span>
    <i
      class="pi pi-chevron-right absolute right-4 top-5 z-20 text-xs text-gray-400 group-hover:text-primary"
      aria-hidden="true"
    />
    <OrderStatusIllustration
      :status="order.status"
      :awaiting-payment="order.awaiting_payment"
      class="pointer-events-none absolute bottom-2 right-2 z-0 h-24 w-[31%] text-primary-strong sm:bottom-3 sm:right-3 sm:h-28"
      aria-hidden="true"
    />
  </button>
</template>

<style scoped>
.order-status-card {
  background: color-mix(in srgb, var(--color-primary) 14%, var(--surface-card, white));
}
</style>
