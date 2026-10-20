<script setup lang="ts">
import { useCartStore } from '../stores/cart.store'

const cartStore = useCartStore()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex justify-between text-sm text-gray-500">
      <span>Товаров</span>
      <span class="tabular-nums">{{ cartStore.totalQuantity }} шт.</span>
    </div>
    <template v-if="cartStore.discountAmount > 0">
      <div class="flex justify-between text-sm text-gray-500">
        <span>Без скидки</span>
        <span class="tabular-nums line-through">{{ cartStore.subtotalAmount }} ₽</span>
      </div>
      <div class="flex justify-between text-sm text-green-700">
        <span>Скидка</span>
        <span class="tabular-nums">−{{ cartStore.discountAmount }} ₽</span>
      </div>
    </template>
    <div class="flex justify-between text-lg font-extrabold text-gray-950">
      <span>Итого</span>
      <span class="tabular-nums">{{ cartStore.totalAmount }} ₽</span>
    </div>
  </div>
</template>
