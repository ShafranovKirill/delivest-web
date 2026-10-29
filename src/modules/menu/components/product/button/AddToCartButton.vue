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
  <ModifierPicker v-if="groups.length && !product?.stopped" v-model="selected" :groups="groups" />
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
</template>
