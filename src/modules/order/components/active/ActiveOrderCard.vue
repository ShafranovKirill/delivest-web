<script setup lang="ts">
import type { ActiveOrder } from '../../api/order.service'
import {
  formatPrice,
  formatTime,
  fulfillmentLabel,
  statusIcon,
  statusLabel,
} from '../../utils/orderStatus'
import OrderStatusSteps from './OrderStatusSteps.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ order: ActiveOrder }>()
defineEmits<{ open: [order: ActiveOrder] }>()

const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="group flex w-full flex-col gap-3 rounded-3xl bg-white p-4 text-left shadow-xs transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
    @click="$emit('open', order)"
  >
    <div class="flex items-center gap-3">
      <span
        class="grid place-items-center size-11 shrink-0 rounded-2xl bg-primary-soft text-primary"
      >
        <i :class="['pi', statusIcon(order.status), 'text-lg']" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {{ t('order.number', { number: order.short_number }) }} ·
          {{ fulfillmentLabel(order.fulfillment_type) }}
        </p>
        <p class="font-extrabold text-gray-950">{{ statusLabel(order.status) }}</p>
      </div>
      <i class="pi pi-chevron-right text-sm text-gray-400 group-hover:text-primary" />
    </div>

    <OrderStatusSteps :order="order" />

    <div class="flex items-center justify-between text-sm">
      <span class="text-gray-500">
        {{
          order.cook_by
            ? t('order.cookBy', { time: formatTime(order.cook_by) })
            : t('order.placedAt', { time: formatTime(order.inserted_at) })
        }}
      </span>
      <span class="font-bold text-gray-900 tabular-nums">{{
        formatPrice(order.total_amount)
      }}</span>
    </div>
  </button>
</template>
