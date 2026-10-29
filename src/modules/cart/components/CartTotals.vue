<script setup lang="ts">
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
        <span class="tabular-nums line-through">{{ cartStore.subtotalAmount }} ₽</span>
      </div>
      <div class="flex justify-between text-sm text-green-700">
        <span>{{ t('cart.discount') }}</span>
        <span class="tabular-nums">−{{ cartStore.discountAmount }} ₽</span>
      </div>
    </template>
    <div v-if="deliveryPrice !== null" class="flex justify-between text-sm text-gray-500">
      <span>
        {{ t('delivery.line') }}
        <span v-if="deliveryPrice && quote?.free_from">
          · {{ t('delivery.freeFrom', { sum: quote.free_from }) }}
        </span>
      </span>
      <span class="tabular-nums">
        {{ deliveryPrice ? `${deliveryPrice} ₽` : t('common.free') }}
      </span>
    </div>
    <div class="flex justify-between text-lg font-extrabold text-gray-950">
      <span>{{ t('common.total') }}</span>
      <span class="tabular-nums">{{ total }} ₽</span>
    </div>
  </div>
</template>
