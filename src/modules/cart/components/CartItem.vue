<script setup lang="ts">
import { formatPrice } from '@/utils/money'
import type { CartItem } from '@/modules/cart/api/cart.service.ts'
import { useCartStore } from '../stores/cart.store.ts'
import ProductImage from '@/modules/menu/components/product/ProductImage.vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  item: CartItem
}>()

const cartStore = useCartStore()
const { t } = useI18n()

function handleDecrease() {
  if (props.item.quantity > 1) {
    cartStore.removeItem(props.item.key)
  } else {
    cartStore.removeAllOfItem(props.item.key)
  }
}

function handleIncrease() {
  const modifiers = (props.item.modifiers ?? [])
    .filter((m) => m.id)
    .map((m) => ({ id: m.id!, quantity: m.quantity }))
  cartStore.addItem(props.item.product_id, modifiers)
}
</script>

<template>
  <div
    class="border rounded-2xl overflow-hidden"
    :class="item.gift ? 'border-green-200 bg-green-50/60' : 'border-border/40 bg-background'"
  >
    <div class="p-3 flex items-center gap-3">
      <ProductImage
        :src="item.image_url"
        :alt="item.name"
        class="w-14 h-14 rounded-2xl shrink-0"
        :class="{ 'opacity-50 grayscale': item.stopped }"
      />
      <div class="grow min-w-0">
        <h4 class="text-sm font-medium leading-tight truncate">
          {{ item.name }}
        </h4>
        <p
          v-for="modifier in item.modifiers ?? []"
          :key="modifier.id ?? modifier.name"
          class="text-xs text-muted-foreground leading-tight truncate"
        >
          + {{ modifier.name
          }}<template v-if="modifier.quantity > 1"> × {{ modifier.quantity }}</template>
        </p>
        <span
          v-if="item.gift"
          class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-green-700"
        >
          <i class="pi pi-gift text-xs" /> {{ t('cart.promoGift') }}
        </span>
        <span v-else-if="item.stopped" class="mt-1 block text-xs font-medium text-red-500">
          {{ t('cart.soldOut') }}
        </span>
      </div>
      <button
        v-if="!item.gift"
        type="button"
        @click="cartStore.removeAllOfItem(item.key)"
        class="text-muted-foreground hover:text-destructive p-1 transition-colors shrink-0"
        :title="t('cart.remove')"
      >
        <i class="pi pi-trash text-base"></i>
      </button>
    </div>

    <div class="border-t border-border/40"></div>

    <div class="p-3 flex items-center justify-between gap-2">
      <div class="flex flex-col">
        <span class="text-xs text-muted-foreground">{{ t('common.total') }}</span>
        <span class="text-sm font-semibold leading-none">
          <span
            v-if="item.base_total > item.total_price"
            class="mr-1 text-xs font-normal text-muted-foreground line-through"
          >
            {{ formatPrice(item.base_total) }}
          </span>
          {{ item.gift ? t('common.free') : formatPrice(item.total_price) }}
        </span>
      </div>

      <span v-if="item.gift" class="text-sm font-medium text-green-700">× {{ item.quantity }}</span>

      <div
        v-else
        class="flex items-center gap-2 border border-border/40 rounded-xl p-1 bg-muted/40"
      >
        <button
          type="button"
          @click="handleDecrease"
          class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-xs font-medium"
        >
          <i class="pi pi-minus"></i>
        </button>
        <span class="text-sm font-medium min-w-5 text-center">
          {{ item.quantity }}
        </span>
        <button
          type="button"
          @click="handleIncrease"
          :disabled="item.stopped"
          class="disabled:opacity-40 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-xs font-medium"
        >
          <i class="pi pi-plus"></i>
        </button>
      </div>
    </div>
  </div>
</template>
