<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '../stores/cart.store'
import { useOpenPromoGiftChoice } from '../composables/useOpenPromoGiftChoice'
const cart = useCartStore()
const { t } = useI18n()
const openGiftChoice = useOpenPromoGiftChoice()
const promotions = computed(() =>
  cart.promotions.filter(
    (p) =>
      p.gift_choice &&
      (!p.gift_choice.available || p.gift_choice.selected.length < p.gift_choice.required),
  ),
)
const error = ref('')
async function clear(id: string) {
  error.value = ''
  try {
    await cart.choosePromoGifts(id, [])
  } catch {
    error.value = t('promo.giftChoice.error')
  }
}
</script>
<template>
  <article
    v-for="promotion in promotions"
    :key="promotion.promotion_id"
    class="overflow-hidden rounded-3xl border border-primary/15 bg-primary-soft/40 p-3"
  >
    <div class="flex items-center gap-3">
      <div
        class="relative grid size-[72px] shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-xs"
      >
        <span class="absolute inset-2 rounded-full bg-primary-soft" /><i
          class="pi pi-gift relative text-3xl"
        />
      </div>
      <div class="min-w-0 flex-1">
        <p class="mb-1 text-xs font-medium text-gray-500">{{ promotion.name }}</p>
        <h4 class="text-sm font-semibold leading-snug text-gray-950">
          {{
            t(
              !promotion.gift_choice?.available
                ? 'promo.giftChoice.unavailable'
                : 'promo.giftChoice.title',
            )
          }}
        </h4>
        <p
          v-if="
            promotion.gift_choice?.available &&
            promotion.gift_choice.selected.length < promotion.gift_choice.required
          "
          class="mt-1 text-xs text-gray-500"
        >
          {{ t('promo.giftChoice.cardHint', { count: promotion.gift_choice.required }) }}
        </p>
      </div>
    </div>
    <div class="mt-3 flex items-center justify-between gap-3 border-t border-primary/10 pt-3">
      <span class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary">{{
        t('promo.giftChoice.free')
      }}</span>
      <button
        v-if="promotion.gift_choice?.available"
        type="button"
        class="inline-flex items-center gap-2 rounded-full bg-primary-fill px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
        :disabled="cart.isLoading"
        @click="openGiftChoice(promotion.promotion_id)"
      >
        {{ t('promo.giftChoice.choose') }}
        <i class="pi pi-arrow-right text-xs" />
      </button>
      <button
        v-else
        type="button"
        class="rounded-full px-3 py-2 text-xs font-medium text-gray-500 hover:bg-white disabled:opacity-40"
        :disabled="cart.isLoading"
        @click="clear(promotion.promotion_id)"
      >
        {{ t('promo.giftChoice.clear') }}
      </button>
    </div>
  </article>
  <p v-if="error" role="alert" class="text-xs text-red-600">{{ error }}</p>
</template>
