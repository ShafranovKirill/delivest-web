<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { intlLocale } from '@/i18n'
import { formatPrice } from '@/utils/money'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useDeliveryQuote } from '@/modules/fulfillment/composables/useDeliveryQuote'
import CartPromotions from '@/modules/cart/components/CartPromotions.vue'
import PromoCodeInput from '@/modules/cart/components/PromoCodeInput.vue'

const { t } = useI18n()
const cartStore = useCartStore()
const delivery = useDeliveryQuote()

const goodsLabel = computed(() => {
  const count = cartStore.totalQuantity
  const rule = new Intl.PluralRules(intlLocale()).select(count)
  return t(`order.form.goods.${rule}`, { count })
})

const deliveryFee = computed(() => delivery.price.value)
const total = computed(() => cartStore.totalAmount + (deliveryFee.value ?? 0))
</script>

<template>
  <section class="rounded-3xl bg-gray-50 p-6">
    <h2 class="text-xl font-extrabold text-gray-950">{{ t('order.composition') }}</h2>

    <ul class="mt-5 flex flex-col gap-4">
      <li v-for="item in cartStore.items" :key="item.key" class="flex items-start gap-4">
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

    <div class="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-5">
      <CartPromotions />
      <PromoCodeInput />
    </div>

    <div class="mt-5 flex flex-col gap-1.5 border-t border-gray-200 pt-5 text-sm text-gray-600">
      <div class="flex justify-between">
        <span>{{ goodsLabel }}</span>
        <span class="tabular-nums">{{ formatPrice(cartStore.subtotalAmount) }}</span>
      </div>
      <div v-if="cartStore.discountAmount > 0" class="flex justify-between text-green-700">
        <span>{{ t('cart.discount') }}</span>
        <span class="tabular-nums">−{{ formatPrice(cartStore.discountAmount) }}</span>
      </div>
      <div v-if="deliveryFee !== null" class="flex justify-between">
        <span>{{ t('delivery.line') }}</span>
        <span class="tabular-nums">
          {{ deliveryFee ? formatPrice(deliveryFee) : t('common.free') }}
        </span>
      </div>
      <div class="mt-2 flex justify-between text-lg font-extrabold text-gray-950">
        <span>{{ t('order.form.orderTotal') }}</span>
        <span class="tabular-nums">{{ formatPrice(total) }}</span>
      </div>
    </div>
  </section>
</template>
