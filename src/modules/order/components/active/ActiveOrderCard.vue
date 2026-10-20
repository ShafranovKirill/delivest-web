<script setup lang="ts">
import type { ActiveOrder } from '../../api/order.service'
import { FULFILLMENT_LABELS, STATUS_INFO, formatPrice, formatTime } from '../../utils/orderStatus'
import OrderStatusSteps from './OrderStatusSteps.vue'

defineProps<{ order: ActiveOrder }>()
defineEmits<{ open: [order: ActiveOrder] }>()
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
        <i :class="['pi', STATUS_INFO[order.status].icon, 'text-lg']" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Заказ {{ order.number }} · {{ FULFILLMENT_LABELS[order.fulfillment_type] }}
        </p>
        <p class="font-extrabold text-gray-950">{{ STATUS_INFO[order.status].label }}</p>
      </div>
      <i class="pi pi-chevron-right text-sm text-gray-400 group-hover:text-primary" />
    </div>

    <OrderStatusSteps :order="order" />

    <div class="flex items-center justify-between text-sm">
      <span class="text-gray-500">
        {{
          order.cook_by
            ? `К ${formatTime(order.cook_by)}`
            : `Оформлен в ${formatTime(order.inserted_at)}`
        }}
      </span>
      <span class="font-bold text-gray-900 tabular-nums">{{
        formatPrice(order.total_amount)
      }}</span>
    </div>
  </button>
</template>
