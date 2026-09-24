<script setup lang="ts">
import { useCartStore } from '@/modules/cart/stores/cart.store'

const cartStore = useCartStore()
</script>

<template>
  <div
    class="bg-muted/20 border border-border/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 static lg:sticky top-6 flex flex-col gap-4"
  >
    <h2 class="text-base sm:text-lg font-semibold">Ваш заказ</h2>

    <div class="flex flex-col gap-3 max-h-80 lg:max-h-96 overflow-y-auto pr-1">
      <div
        v-for="item in cartStore.items"
        :key="item.product_id"
        class="flex items-center justify-between gap-3 bg-background p-3 rounded-2xl border border-border/30"
      >
        <div class="min-w-0">
          <h4 class="text-sm font-medium truncate">{{ item.name }}</h4>
          <span class="text-xs text-muted-foreground">
            {{ item.quantity }} шт. × {{ item.price }} ₽
          </span>
        </div>
        <span class="font-semibold text-sm shrink-0">{{ item.total_price }} ₽</span>
      </div>
    </div>

    <div class="border-t border-border/40 pt-4 flex flex-col gap-2">
      <div class="flex justify-between text-sm text-muted-foreground">
        <span>Количество товаров:</span>
        <span>{{ cartStore.totalQuantity }} шт.</span>
      </div>
      <div class="flex justify-between text-lg font-bold">
        <span>Итого к оплате:</span>
        <span>{{ cartStore.totalAmount }} ₽</span>
      </div>
    </div>
  </div>
</template>
