<script setup lang="ts">
import LoyaltyEarnings from '@/modules/account/components/LoyaltyEarnings.vue'

import { formatPrice } from '@/utils/money'
import { computed } from 'vue'
import { useCartStore } from '../stores/cart.store'
import { useI18n } from 'vue-i18n'
import { useDeliveryQuote } from '@/modules/fulfillment/composables/useDeliveryQuote'

const cartStore = useCartStore()
const { t } = useI18n()
const { quote, price: deliveryPrice } = useDeliveryQuote()

const total = computed(() => cartStore.totalAmount + (deliveryPrice.value ?? 0))
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex justify-between text-sm text-gray-500">
      <span>{{ t('cart.items') }}</span>
      <span class="tabular-nums">{{ t('common.pieces', { count: cartStore.totalQuantity }) }}</span>
    </div>
    <template v-if="cartStore.discountAmount > 0">
      <div class="flex justify-between text-sm text-gray-500">
        <span>{{ t('common.withoutDiscount') }}</span>
        <span class="tabular-nums line-through">{{ formatPrice(cartStore.subtotalAmount) }}</span>
      </div>
      <div class="flex justify-between text-sm text-green-700">
        <span>{{ t('cart.discount') }}</span>
        <span class="tabular-nums">−{{ formatPrice(cartStore.discountAmount) }}</span>
      </div>
    </template>
    <div v-if="deliveryPrice !== null" class="flex justify-between text-sm text-gray-500">
      <span>
        {{ t('delivery.line') }}
        <span v-if="deliveryPrice && quote?.free_from">
          · {{ t('delivery.freeFrom', { sum: formatPrice(quote.free_from) }) }}
        </span>
      </span>
      <span class="tabular-nums">
        {{ deliveryPrice ? formatPrice(deliveryPrice) : t('common.free') }}
      </span>
    </div>
    <div class="flex justify-between text-lg font-extrabold text-gray-950">
      <span>{{ t('common.total') }}</span>
      <span class="tabular-nums">{{ formatPrice(total) }}</span>
    </div>
    <LoyaltyEarnings class="mt-2" />
  </div>
</template>
