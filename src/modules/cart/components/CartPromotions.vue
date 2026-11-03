<script setup lang="ts">
import { computed } from 'vue'
import { formatPrice } from '@/utils/money'
import { useCartStore } from '../stores/cart.store'
import { reasonsText } from '../utils/promoText'
import { useI18n } from 'vue-i18n'
import CartPromotionHints from './CartPromotionHints.vue'

withDefaults(defineProps<{ hintsMode?: 'list' | 'carousel' }>(), { hintsMode: 'list' })

const cartStore = useCartStore()
const { t } = useI18n()
const summaries = computed(() =>
  cartStore.promotions.filter((p) => !p.gift_choice || p.discount > 0),
)
</script>

<template>
  <div v-if="summaries.length || cartStore.hints.length" class="flex flex-col gap-2 text-sm">
    <div
      v-for="promotion in summaries"
      :key="promotion.promotion_id"
      class="flex items-start gap-2 text-green-700"
    >
      <i class="pi pi-percentage mt-0.5 text-xs" />
      <span class="min-w-0 flex-1">
        <span class="font-medium">{{ promotion.name }}</span>
        <span
          v-for="gift in promotion.gift_choice ? [] : promotion.gifts"
          :key="gift.product_id"
          class="block text-xs"
        >
          {{ t('cart.gift', { name: gift.name })
          }}<template v-if="gift.quantity > 1"> × {{ gift.quantity }}</template>
        </span>
      </span>
      <span v-if="promotion.discount > 0" class="shrink-0 font-semibold tabular-nums">
        −{{ formatPrice(promotion.discount) }}
      </span>
    </div>

    <CartPromotionHints v-if="hintsMode === 'carousel'" />

    <template v-else>
      <div
        v-for="hint in cartStore.hints"
        :key="hint.promotion_id"
        class="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-amber-800"
      >
        <i class="pi pi-gift mt-0.5 text-xs" />
        <span class="min-w-0 flex-1">
          <span class="font-medium">{{ hint.name }}</span>
          <span class="block text-xs">{{ reasonsText(hint.reasons) }}</span>
        </span>
      </div>
    </template>
  </div>
</template>
