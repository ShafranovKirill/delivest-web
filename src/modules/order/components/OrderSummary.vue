<script setup lang="ts">
import { useCartStore } from '@/modules/cart/stores/cart.store'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const emit = defineEmits<{ (e: 'next'): void }>()

const cartStore = useCartStore()
</script>

<template>
  <SurfaceCard icon="pi-shopping-cart" title="Ваш заказ">
    <ul class="flex flex-col gap-2">
      <li
        v-for="item in cartStore.items"
        :key="item.product_id"
        class="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 p-2 pr-4"
      >
        <span v-if="!compact" class="size-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="item.name"
            class="size-full object-cover"
            loading="lazy"
          />
        </span>
        <span class="min-w-0 flex-1" :class="{ 'pl-2': compact }">
          <span class="block text-sm font-semibold text-gray-900 truncate">{{ item.name }}</span>
          <span class="block text-xs text-gray-500 tabular-nums">
            {{ item.quantity }} × {{ item.price }} ₽
          </span>
        </span>
        <span class="shrink-0 text-sm font-bold text-gray-900 tabular-nums">
          {{ item.total_price }} ₽
        </span>
      </li>
    </ul>

    <div class="mt-4 flex flex-col gap-1.5 border-t border-gray-200 pt-4">
      <div class="flex justify-between text-sm text-gray-500">
        <span>Товаров</span>
        <span class="tabular-nums">{{ cartStore.totalQuantity }} шт.</span>
      </div>
      <div class="flex justify-between text-lg font-extrabold text-gray-950">
        <span>Итого</span>
        <span class="tabular-nums">{{ cartStore.totalAmount }} ₽</span>
      </div>
    </div>
  </SurfaceCard>

  <Button
    v-if="!compact"
    label="Перейти к оформлению"
    icon="pi pi-arrow-right"
    iconPos="right"
    class="w-full h-14 rounded-full! text-base font-semibold mt-3 sm:mt-4"
    @click="emit('next')"
  />
</template>
