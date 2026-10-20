<script setup lang="ts">
import { useCartStore } from '../stores/cart.store'
import { useI18n } from 'vue-i18n'

const cartStore = useCartStore()
const { t } = useI18n()
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
    <div class="flex justify-between text-lg font-extrabold text-gray-950">
      <span>{{ t('common.total') }}</span>
      <span class="tabular-nums">{{ cartStore.totalAmount }} ₽</span>
    </div>
  </div>
</template>
