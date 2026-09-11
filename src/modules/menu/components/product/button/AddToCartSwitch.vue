<script setup lang="ts">
import { computed, ref } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import type { MenuProduct } from '@/modules/menu/api/menu.service'

const props = defineProps<{ product: MenuProduct }>()
const cartStore = useCartStore()

const isPending = ref(false)

const quantity = computed(() => {
  const productId = props.product?.id
  if (!productId || !cartStore.items) return 0

  const item = cartStore.items.find((i) => String(i.product_id) === String(productId))

  return item?.quantity ?? 0
})

const handleAdd = async (event: Event) => {
  event.stopPropagation()
  if (!props.product?.id || isPending.value) return

  isPending.value = true
  try {
    await cartStore.addItem(String(props.product.id))
  } catch (error) {
    console.error('[AddToCartSwitch] Failed to add item:', error)
  } finally {
    isPending.value = false
  }
}

const handleRemove = async (event: Event) => {
  event.stopPropagation()
  if (!props.product?.id || isPending.value) return

  isPending.value = true
  try {
    await cartStore.removeItem(String(props.product.id))
  } catch (error) {
    console.error('[AddToCartSwitch] Failed to remove item:', error)
  } finally {
    isPending.value = false
  }
}
</script>

<template>
  <div class="mt-auto w-full flex justify-center">
    <template v-if="quantity > 0">
      <div
        @click.stop
        class="bg-(--p-primary-color) flex items-center justify-between w-full rounded-full text-white py-1.5 px-3 gap-2 select-none"
      >
        <button
          type="button"
          @click="handleRemove"
          :disabled="isPending"
          class="w-8 h-8 flex items-center justify-center text-xl font-bold rounded-full hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-50 cursor-pointer border-none text-white bg-transparent outline-none"
        >
          −
        </button>

        <span class="text-base font-bold text-white flex items-center justify-center">
          <ProgressSpinner
            v-if="isPending"
            style="width: 20px; height: 20px"
            strokeWidth="6"
            animationDuration=".8s"
            class="white-spinner"
          />
          <template v-else>{{ quantity }}</template>
        </span>

        <button
          type="button"
          @click="handleAdd"
          :disabled="isPending"
          class="w-8 h-8 flex items-center justify-center text-xl font-bold rounded-full hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-50 cursor-pointer border-none text-white bg-transparent outline-none"
        >
          +
        </button>
      </div>
    </template>

    <template v-else>
      <button
        type="button"
        @click="handleAdd"
        :disabled="isPending"
        class="bg-(--p-primary-color) w-full rounded-full text-white py-2 px-4 flex items-center justify-center gap-2 cursor-pointer border-none font-bold hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[40px]"
      >
        <ProgressSpinner
          v-if="isPending"
          style="width: 20px; height: 20px"
          strokeWidth="6"
          animationDuration=".8s"
          class="white-spinner"
        />
        <template v-else>
          <span>{{ `${product.price} ₽` }}</span>
          <span
            v-if="product.old_price && product.old_price !== '0.00'"
            class="text-sm opacity-70 line-through"
          >
            {{ product.old_price }} ₽
          </span>
        </template>
      </button>
    </template>
  </div>
</template>
<style scoped>
:deep(.white-spinner circle) {
  stroke: #ffffff !important;
}
</style>
