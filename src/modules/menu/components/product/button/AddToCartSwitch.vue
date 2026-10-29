<script setup lang="ts">
import { formatPrice } from '@/utils/money'
import { computed, ref } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useFulfillmentFlowStore } from '@/modules/fulfillment/stores/fulfillmentFlow.store'
import { getApiErrorMessage } from '@/api/errors'
import type { MenuProduct } from '@/modules/menu/api/menu.service'
import SoldOutLabel from './SoldOutLabel.vue'
import { useI18n } from 'vue-i18n'
import { useMenuStore } from '@/modules/menu/stores/menu.store'

const props = defineProps<{ product: MenuProduct }>()
const cartStore = useCartStore()
const flowStore = useFulfillmentFlowStore()
const toast = useToast()
const { t } = useI18n()
const menuStore = useMenuStore()

const hasModifiers = computed(() => (props.product.modifier_groups ?? []).length > 0)

function showError(error: unknown) {
  toast.add({
    severity: 'error',
    summary: t('cart.title'),
    detail: getApiErrorMessage(error),
    life: 3000,
  })
}

const isPending = ref(false)

const lines = computed(() =>
  cartStore.items.filter((i) => String(i.product_id) === String(props.product?.id) && !i.gift),
)

const quantity = computed(() => lines.value.reduce((sum, i) => sum + i.quantity, 0))

const handleAdd = async (event: Event) => {
  event.stopPropagation()
  if (!props.product?.id || isPending.value) return
  if (hasModifiers.value) return menuStore.openProductModal(props.product)
  if (!(await flowStore.ensure())) return

  isPending.value = true
  try {
    await cartStore.addItem(String(props.product.id))
  } catch (error) {
    console.error('[AddToCartSwitch] Failed to add item:', error)
    showError(error)
  } finally {
    isPending.value = false
  }
}

const handleRemove = async (event: Event) => {
  event.stopPropagation()
  const line = lines.value[lines.value.length - 1]
  if (!line || isPending.value) return

  isPending.value = true
  try {
    await cartStore.removeItem(line.key)
  } catch (error) {
    console.error('[AddToCartSwitch] Failed to remove item:', error)
    showError(error)
  } finally {
    isPending.value = false
  }
}
</script>

<template>
  <SoldOutLabel v-if="product.stopped" />
  <div v-else class="mt-auto w-full flex justify-center">
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
        class="bg-(--p-primary-color) w-full rounded-full text-white py-2 px-4 flex items-center justify-center gap-2 cursor-pointer border-none font-bold hover:opacity-90 transition-opacity disabled:opacity-50 min-h-10"
      >
        <ProgressSpinner
          v-if="isPending"
          style="width: 20px; height: 20px"
          strokeWidth="6"
          animationDuration=".8s"
          class="white-spinner"
        />
        <template v-else>
          <span>{{ formatPrice(product.price) }}</span>
          <span
            v-if="product.old_price && product.old_price > (product.price ?? 0)"
            class="text-sm opacity-70 line-through"
          >
            {{ formatPrice(product.old_price) }}
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
