<script setup lang="ts">
import { useCartStore } from '@/modules/cart/stores/cart.store'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
import CartPromotions from '@/modules/cart/components/CartPromotions.vue'
import CartTotals from '@/modules/cart/components/CartTotals.vue'
import PromoCodeInput from '@/modules/cart/components/PromoCodeInput.vue'
import { useI18n } from 'vue-i18n'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const emit = defineEmits<{ (e: 'next'): void }>()

const cartStore = useCartStore()
const { t } = useI18n()
</script>

<template>
  <SurfaceCard icon="pi-shopping-cart" :title="t('order.summary')">
    <ul class="flex flex-col gap-2">
      <li
        v-for="item in cartStore.items"
        :key="item.key"
        class="flex items-center gap-3 rounded-2xl border p-2 pr-4"
        :class="item.gift ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'"
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
          <span v-if="item.gift" class="block text-xs font-medium text-green-700">
            <i class="pi pi-gift text-xs" /> {{ t('order.giftCount', { count: item.quantity }) }}
          </span>
          <span v-else class="block text-xs text-gray-500 tabular-nums">
            {{ item.quantity }} × {{ item.price }} ₽
          </span>
        </span>
        <span class="shrink-0 text-right text-sm font-bold text-gray-900 tabular-nums">
          <span
            v-if="item.base_total > item.total_price"
            class="block text-xs font-normal text-gray-400 line-through"
          >
            {{ item.base_total }} ₽
          </span>
          {{ item.gift ? t('common.free') : `${item.total_price} ₽` }}
        </span>
      </li>
    </ul>

    <div class="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4">
      <CartPromotions />
      <PromoCodeInput />
      <CartTotals />
    </div>
  </SurfaceCard>

  <Button
    v-if="!compact"
    :label="t('order.toCheckout')"
    icon="pi pi-arrow-right"
    iconPos="right"
    class="w-full h-14 rounded-full! text-base font-semibold mt-3 sm:mt-4"
    @click="emit('next')"
  />
</template>
