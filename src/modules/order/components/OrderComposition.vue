<script setup lang="ts">
import StarRewardBadge from '@/modules/account/components/StarRewardBadge.vue'

import OrderPickRow from './OrderPickRow.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { intlLocale } from '@/i18n'
import { formatPrice } from '@/utils/money'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import CartPromotions from '@/modules/cart/components/CartPromotions.vue'
import PromoCodeInput from '@/modules/cart/components/PromoCodeInput.vue'
import BasketFilledIcon from '~icons/tabler/basket-filled'

defineProps<{ compact?: boolean }>()
const expanded = ref(false)

const { t } = useI18n()
const cartStore = useCartStore()

const goodsLabel = computed(() => {
  const count = cartStore.totalQuantity
  const rule = new Intl.PluralRules(intlLocale()).select(count)
  return t(`order.form.goods.${rule}`, { count })
})

</script>

<template>
  <section class="rounded-2xl" :class="{ 'bg-gray-50': expanded || !compact }">
    <h2>
      <OrderPickRow
        :title="t('order.composition')"
        :text="goodsLabel"
        :arrow="expanded ? 'up' : 'down'"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        <template #icon><BasketFilledIcon class="size-[22px]" /></template>
      </OrderPickRow>
    </h2>

    <ul v-if="expanded" class="px-4 mt-4 flex flex-col gap-3">
      <li v-for="item in cartStore.items" :key="item.key" class="flex items-start gap-3">
        <div class="min-w-0 flex-1">
          <p class="font-semibold leading-snug text-gray-950">{{ item.name }}</p>
          <p
            v-for="modifier in item.modifiers ?? []"
            :key="modifier.id ?? modifier.name"
            class="text-xs leading-snug text-gray-500"
          >
            + {{ modifier.name
            }}<template v-if="modifier.quantity > 1"> × {{ modifier.quantity }}</template>
          </p>
          <StarRewardBadge :amount="item.stars_reward" :quantity="item.quantity" />
          <p v-if="item.gift" class="text-xs font-medium text-green-700">
            {{ t('cart.promoGift') }}
          </p>
          <p v-else-if="item.stopped" class="text-xs font-medium text-red-500">
            {{ t('cart.soldOut') }}
          </p>
        </div>
        <div class="shrink-0 text-right tabular-nums">
          <p v-if="item.quantity > 1" class="text-xs text-gray-500">{{ item.quantity }} ×</p>
          <p class="font-semibold text-gray-950">
            {{ item.gift ? t('common.free') : formatPrice(item.total_price) }}
          </p>
        </div>
      </li>
    </ul>

    <div
      v-if="expanded || !compact"
      class="mx-4 mt-4 flex flex-col gap-2 pb-4 border-t border-gray-200 pt-4"
    >
      <CartPromotions />
      <PromoCodeInput />
    </div>

  </section>
</template>
