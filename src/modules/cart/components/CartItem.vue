<script setup lang="ts">
import type { CartItem } from '@/modules/cart/api/cart.service.ts'
import { ref } from 'vue'
import { useCartStore } from '../stores/cart.store.ts'
import { useImagePlaceholder } from '@/modules/menu/composables/useImagePlaceholder.ts'

const props = defineProps<{
  item: CartItem
}>()

const cartStore = useCartStore()
const imageError = ref(false)

const { getImageUrl } = useImagePlaceholder()

function handleImageError() {
  imageError.value = true
}

function handleDecrease() {
  if (props.item.quantity > 1) {
    cartStore.removeItem(props.item.product_id)
  } else {
    cartStore.removeAllOfItem(props.item.product_id)
  }
}
</script>

<template>
  <div class="border border-border/40 rounded-2xl overflow-hidden bg-background">
    <div class="p-3 flex items-center gap-3">
      <img
        :src="getImageUrl(item.image_url)"
        :alt="item.name"
        @error="handleImageError"
        class="w-14 h-14 object-cover rounded-2xl shrink-0 block"
      />
      <div class="grow min-w-0">
        <h4 class="text-sm font-medium leading-tight truncate">
          {{ item.name }}
        </h4>
      </div>
      <button
        type="button"
        @click="cartStore.removeAllOfItem(item.product_id)"
        class="text-muted-foreground hover:text-destructive p-1 transition-colors shrink-0"
        title="Удалить из корзины"
      >
        <i class="pi pi-trash text-base"></i>
      </button>
    </div>

    <div class="border-t border-border/40"></div>

    <div class="p-3 flex items-center justify-between gap-2">
      <div class="flex flex-col">
        <span class="text-xs text-muted-foreground">Итого</span>
        <span class="text-sm font-semibold leading-none"> {{ item.total_price }} ₽ </span>
      </div>

      <div class="flex items-center gap-2 border border-border/40 rounded-xl p-1 bg-muted/40">
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
          @click="cartStore.addItem(item.product_id)"
          class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-xs font-medium"
        >
          <i class="pi pi-plus"></i>
        </button>
      </div>
    </div>
  </div>
</template>
