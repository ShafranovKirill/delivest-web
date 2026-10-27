<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Order } from '../../api/order.service'
import { formatPrice, formatTime, fulfillmentLabel, paymentLabel } from '../../utils/orderStatus'
import { formatAddress, type AddressParts } from '@/modules/shared/utils/address'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'

const props = defineProps<{ order: Order }>()

const { t } = useI18n()

const isDelivery = computed(() => props.order.fulfillment_type === 'delivery')

const place = computed(
  () =>
    formatAddress(props.order.address as AddressParts | null) ||
    (isDelivery.value ? t('order.addressByOperator') : t('order.atBranch')),
)

const rows = computed(() => [
  {
    icon: isDelivery.value ? 'pi-map-marker' : 'pi-shopping-bag',
    label: fulfillmentLabel(props.order.fulfillment_type),
    value: place.value,
  },
  {
    icon: 'pi-clock',
    label: t('order.time'),
    value: props.order.cook_by
      ? t('order.cookBy', { time: formatTime(props.order.cook_by) })
      : t('order.asap'),
  },
  {
    icon: 'pi-wallet',
    label: t('order.payment.title'),
    value: paymentLabel(props.order.payment_method),
  },
])
</script>

<template>
  <SurfaceCard>
    <ul class="flex flex-col gap-3">
      <li v-for="row in rows" :key="row.icon" class="flex items-center gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-xs"
        >
          <i :class="['pi', row.icon]" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-xs text-gray-400">{{ row.label }}</span>
          <span class="block font-semibold text-gray-900 break-words">{{ row.value }}</span>
        </span>
      </li>
    </ul>

    <div
      class="mt-4 flex items-baseline justify-between border-t border-gray-200 pt-4 font-extrabold text-gray-950"
    >
      <span>{{ t('common.total') }}</span>
      <span class="text-xl tabular-nums">{{ formatPrice(order.total_amount) }}</span>
    </div>
  </SurfaceCard>
</template>
