<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Order } from '../../api/order.service'
import { formatPrice } from '@/utils/money'
import { paymentLabel } from '../../utils/orderStatus'
import ProductImage from '@/modules/menu/components/product/ProductImage.vue'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'

defineProps<{ order: Order }>()
const { t } = useI18n()
</script>

<template>
  <SurfaceCard>
    <ul class="flex flex-col gap-3">
      <li
        v-for="(item, index) in order.items"
        :key="`${item.product_id}:${index}`"
        class="flex min-w-0 items-center gap-3"
      >
        <ProductImage :src="item.image_url" :alt="item.title" class="size-10 shrink-0 rounded-lg" />
        <span class="flex min-w-0 flex-1 items-center gap-1 text-sm font-semibold text-gray-900">
          <span
            class="min-w-0 truncate"
            :title="
              [item.title, ...(item.modifiers ?? []).map((modifier) => modifier.name)].join(' · ')
            "
            >{{ item.title }}</span
          >
          <span v-if="item.quantity > 1" class="shrink-0 font-normal text-gray-500"
            >× {{ item.quantity }}</span
          >
        </span>
        <span class="shrink-0 text-sm font-semibold text-gray-950 tabular-nums">
          {{ item.gift ? t('common.free') : formatPrice(item.price * item.quantity) }}
        </span>
      </li>
    </ul>

    <div class="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4 text-sm">
      <div class="flex justify-between gap-3 text-gray-600">
        <span>{{ t('order.success.orderAmount') }}</span>
        <span class="tabular-nums">{{ formatPrice(order.subtotal_amount) }}</span>
      </div>
      <div v-if="order.discount_amount > 0" class="flex justify-between gap-3 text-gray-600">
        <span>{{ t('cart.discount') }}</span>
        <span class="tabular-nums">−{{ formatPrice(order.discount_amount) }}</span>
      </div>
      <div
        v-if="order.fulfillment_type === 'delivery'"
        class="flex justify-between gap-3 text-gray-600"
      >
        <span>{{ t('order.fulfillment.delivery') }}</span>
        <span class="tabular-nums">{{
          order.delivery_amount ? formatPrice(order.delivery_amount) : t('common.free')
        }}</span>
      </div>
      <div class="flex justify-between gap-3 text-gray-600">
        <span>{{ t('order.payment.title') }}</span>
        <span>{{ paymentLabel(order.payment_method) }}</span>
      </div>
    </div>

    <div
      class="mt-4 flex items-baseline justify-between border-t border-gray-200 pt-4 font-extrabold text-gray-950"
    >
      <span>{{ t('common.total') }}</span>
      <span class="text-xl tabular-nums">{{ formatPrice(order.total_amount) }}</span>
    </div>
  </SurfaceCard>
</template>
