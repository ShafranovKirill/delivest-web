<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '../stores/cart.store'
import { useOpenCart } from '../composables/useOpenCart'
import { formatPrice } from '@/utils/money'

const props = defineProps<{ promotionId: string }>()
const openCart = useOpenCart()
const { t } = useI18n()
const cart = useCartStore()
const choice = computed(
  () => cart.promotions.find((p) => p.promotion_id === props.promotionId)?.gift_choice,
)
const selected = ref<string[]>([])
const pending = ref(false)
const error = ref('')
watch(
  choice,
  (value) => {
    selected.value = value?.selected.slice() ?? []
  },
  { immediate: true },
)
const valid = computed(
  () => choice.value?.available && selected.value.length === choice.value.required,
)
function toggle(id: string) {
  if (pending.value || !choice.value?.available) return
  if (choice.value.required === 1) selected.value = [id]
  else if (selected.value.includes(id))
    selected.value = selected.value.filter((value) => value !== id)
  else if (selected.value.length < choice.value.required) selected.value.push(id)
}
async function save(clear = false) {
  if (pending.value || (!clear && !valid.value)) return
  pending.value = true
  error.value = ''
  try {
    await cart.choosePromoGifts(props.promotionId, clear ? [] : selected.value)
    openCart()
  } catch {
    error.value = t('promo.giftChoice.error')
    try {
      await cart.fetchCart(undefined, true)
    } catch {
      /* Keep the error visible for retry. */
    }
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4">
    <button
      type="button"
      class="flex w-fit items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary"
      :disabled="pending"
      @click="openCart()"
    >
      <i class="pi pi-arrow-left text-xs" /> {{ t('promo.giftChoice.backToCart') }}
    </button>
    <h2 class="text-xl font-bold">{{ t('promo.giftChoice.title') }}</h2>
    <p class="text-sm text-gray-600">{{ t('promo.giftChoice.hint') }}</p>
    <p v-if="!choice?.available" class="text-sm text-amber-700">
      {{ t('promo.giftChoice.unavailable') }}
    </p>
    <p v-if="choice" class="text-sm font-semibold" aria-live="polite">
      {{ t('promo.giftChoice.counter', { count: selected.length, required: choice.required }) }}
    </p>
    <div class="min-h-0 flex-1 overflow-y-auto space-y-3">
      <label
        v-for="option in choice?.options ?? []"
        :key="option.product_id"
        class="flex cursor-pointer items-center gap-3 rounded-2xl border p-3"
        :class="
          selected.includes(option.product_id)
            ? 'border-primary bg-primary-soft'
            : 'border-gray-200'
        "
      >
        <input
          :type="choice?.required === 1 ? 'radio' : 'checkbox'"
          name="promo-gift"
          :aria-label="option.name"
          :checked="selected.includes(option.product_id)"
          :disabled="
            pending ||
            !choice?.available ||
            (choice.required > 1 &&
              !selected.includes(option.product_id) &&
              selected.length >= choice.required)
          "
          @change="toggle(option.product_id)"
        />
        <img
          v-if="option.image_url"
          :src="option.image_url"
          alt=""
          class="size-16 rounded-xl object-cover"
        />
        <span class="min-w-0 flex-1"
          ><span class="block font-medium">{{ option.name }}</span
          ><span class="text-xs text-gray-500 line-through">{{ formatPrice(option.price) }}</span
          ><span class="ml-2 text-sm font-semibold text-green-700">{{
            t('promo.giftChoice.free')
          }}</span></span
        >
      </label>
    </div>
    <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>
    <button
      type="button"
      class="rounded-xl bg-primary-fill px-4 py-3 font-semibold text-white disabled:opacity-40"
      :disabled="pending || !valid"
      @click="save()"
    >
      {{ t('promo.giftChoice.confirm') }}
    </button>
    <button
      type="button"
      class="rounded-xl px-4 py-2 text-sm text-gray-600 disabled:opacity-40"
      :disabled="pending || !choice"
      @click="save(true)"
    >
      {{ t('promo.giftChoice.clear') }}
    </button>
  </div>
</template>
