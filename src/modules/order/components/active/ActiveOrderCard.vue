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
    class="order-status-card group relative isolate flex min-h-44 w-full cursor-pointer flex-col items-start overflow-hidden rounded-3xl bg-white p-5 pb-12 pt-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
    @click="$emit('open', order)"
  >
    <svg
      class="pointer-events-none absolute inset-0 -z-10 h-full w-full text-primary"
      viewBox="0 0 1000 300"
      preserveAspectRatio="none"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path opacity="0.20" d="M0 -40 H1000 V110 C760 140 645 105 500 55 C345 -10 160 -30 0 -30 Z" />
      <path opacity="0.20" d="M0 -80 H1000 V56 C790 84 660 51 520 14 C355 -30 180 -60 0 -60 Z" />
      <g transform="translate(0 8)">
        <path
          opacity="0.20"
          d="M0 216 C200 191 360 236 540 274 C700 314 860 282 1000 252 V340 H0 Z"
        />
        <path
          opacity="0.20"
          d="M0 246 C190 220 330 272 500 312 C680 346 840 312 1000 288 V340 H0 Z"
        />
      </g>
    </svg>
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
      <span v-if="order.cook_by" class="mt-3 block text-sm leading-snug text-gray-500">
        {{ t('order.cookBy', { time: formatTime(order.cook_by) }) }}
      </span>
      <span
        class="block font-semibold tabular-nums text-gray-900"
        :class="order.cook_by ? 'mt-1' : 'mt-3'"
      >
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
