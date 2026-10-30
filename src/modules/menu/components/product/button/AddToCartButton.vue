<script setup lang="ts">
import { formatPrice } from '@/utils/money'
import { useToast } from 'primevue/usetoast'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useFulfillmentFlowStore } from '@/modules/fulfillment/stores/fulfillmentFlow.store'
import { getApiErrorMessage } from '@/api/errors'
import type { MenuProduct } from '@/modules/menu/api/menu.service'
import SoldOutLabel from './SoldOutLabel.vue'
import ModifierPicker from '../ModifierPicker.vue'
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  product?: MenuProduct | null
}>()

const emit = defineEmits<{
  (e: 'added'): void
}>()

const cartStore = useCartStore()
const flowStore = useFulfillmentFlowStore()
const toast = useToast()
const { t } = useI18n()

const groups = computed(() => props.product?.modifier_groups ?? [])
const modifiers = computed(() => groups.value.flatMap((g) => g.modifiers))
const selected = ref<string[]>([])

watch(
  () => props.product?.id,
  () => {
    selected.value = modifiers.value.filter((m) => m.is_default && !m.stopped).map((m) => m.id)
  },
  { immediate: true },
)

const extra = computed(() =>
  modifiers.value.filter((m) => selected.value.includes(m.id)).reduce((sum, m) => sum + m.price, 0),
)

const lines = computed(() =>
  cartStore.items.filter((i) => String(i.product_id) === String(props.product?.id) && !i.gift),
)

function modifierText(line: (typeof lines.value)[number]) {
  const list = line.modifiers ?? []
  if (!list.length) return t('menu.noModifiers')
  return list.map((m) => (m.quantity > 1 ? `${m.name} × ${m.quantity}` : m.name)).join(', ')
}

function more(line: (typeof lines.value)[number]) {
  const choice = (line.modifiers ?? [])
    .filter((m) => m.id)
    .map((m) => ({ id: m.id!, quantity: m.quantity }))
  return cartStore.addItem(props.product!.id!, choice.length ? choice : undefined)
}

function less(line: (typeof lines.value)[number]) {
  return line.quantity > 1 ? cartStore.removeItem(line.key) : cartStore.removeAllOfItem(line.key)
}

const handleAddToCart = async () => {
  if (!props.product || !(await flowStore.ensure())) return
  try {
    const choice = groups.value.length
      ? selected.value.map((id) => ({ id, quantity: 1 }))
      : undefined
    await cartStore.addItem(props.product.id!, choice)
    emit('added')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('cart.title'),
      detail: getApiErrorMessage(error),
      life: 3000,
    })
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <ModifierPicker v-if="groups.length && !product?.stopped" v-model="selected" :groups="groups" />
    <div v-if="lines.length" class="rounded-2xl bg-gray-50 p-3">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {{ t('menu.inCart') }}
      </p>
      <ul class="flex flex-col gap-2">
        <li v-for="line in lines" :key="line.key" class="flex items-center gap-3">
          <span class="min-w-0 flex-1 text-sm leading-snug text-gray-800">
            {{ modifierText(line) }}
            <span class="block text-xs tabular-nums text-gray-500">
              {{ formatPrice(line.total_price) }}
            </span>
          </span>
          <div class="flex shrink-0 items-center gap-1 rounded-full bg-white p-0.5 shadow-xs">
            <button
              type="button"
              class="grid size-7 place-items-center rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"
              :disabled="cartStore.isLoading"
              @click="less(line)"
            >
              <i class="pi pi-minus text-[10px]" />
            </button>
            <span class="min-w-6 text-center text-sm font-bold tabular-nums">{{
              line.quantity
            }}</span>
            <button
              type="button"
              class="grid size-7 place-items-center rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"
              :disabled="cartStore.isLoading || line.stopped"
              @click="more(line)"
            >
              <i class="pi pi-plus text-[10px]" />
            </button>
          </div>
        </li>
      </ul>
    </div>
    <SoldOutLabel v-if="product?.stopped" class="py-3.5!" />
    <Button
      v-else
      @click="handleAddToCart"
      :loading="cartStore.isLoading"
      :disabled="!product || cartStore.isLoading"
      class="whitespace-nowrap rounded-3xl! w-full! flex items-center justify-center gap-2 py-3.5! px-6 font-semibold transition-all hover:opacity-95"
    >
      <span>{{ t('menu.addToCart', { price: formatPrice((product?.price ?? 0) + extra) }) }}</span>

      <span
        v-if="product?.old_price && product.old_price > (product.price ?? 0)"
        class="line-through text-xs opacity-70 font-normal"
      >
        {{ formatPrice(product.old_price + extra) }}
      </span>
    </Button>
  </div>
</template>
