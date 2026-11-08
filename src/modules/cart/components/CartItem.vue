<script setup lang="ts">
import { computed, ref } from 'vue'
import { getApiErrorMessage } from '@/api/errors'
import { useOpenPromoGiftChoice } from '../composables/useOpenPromoGiftChoice'
import StarRewardBadge from '@/modules/account/components/StarRewardBadge.vue'

import { formatPrice } from '@/utils/money'
import type { CartItem } from '@/modules/cart/api/cart.service.ts'
import { useCartStore } from '../stores/cart.store.ts'
import ProductImage from '@/modules/menu/components/product/ProductImage.vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useDesktopModalStore } from '@/modules/widgets/modal/desktop-modal/stores/modal.store.ts'
import { useMobileModalStore } from '@/modules/widgets/modal/mobile-modal/stores/modal.store.ts'
import { useMenuStore } from '@/modules/menu/stores/menu.store'
import { PRODUCT_QUERY_KEY } from '@/modules/menu/composables/useProductRoute'

const props = defineProps<{
  item: CartItem
}>()

const cartStore = useCartStore()
const openGiftChoice = useOpenPromoGiftChoice()
const giftPromotion = computed(() =>
  props.item.gift
    ? cartStore.promotions.find(
        (p) =>
          props.item.promotion_ids.includes(p.promotion_id) &&
          p.gift_choice?.selected.includes(props.item.product_id),
      )
    : undefined,
)
const { t } = useI18n()
const router = useRouter()
const menuStore = useMenuStore()
const branchStore = useBranchStore()
const desktopModalStore = useDesktopModalStore()
const mobileModalStore = useMobileModalStore()
const operationError = ref<string | null>(null)
let retryAction: (() => Promise<unknown>) | null = null
async function run(action: () => Promise<unknown>) {
  operationError.value = null
  try {
    await action()
    retryAction = null
  } catch (error) {
    operationError.value = getApiErrorMessage(error)
    retryAction = action
  }
}

function handleEdit() {
  const slug = branchStore.activeBranch?.slug
  if (!slug) return

  desktopModalStore.closeModal()
  mobileModalStore.closeModal()
  menuStore.returnToCart = true
  menuStore.editingKey = props.item.key
  router.push({
    name: 'menu',
    params: { slug },
    query: { [PRODUCT_QUERY_KEY]: props.item.product_id },
  })
}

function handleDecrease() {
  run(() => cartStore.removeItem(props.item.key))
}

function handleIncrease() {
  const modifiers = (props.item.modifiers ?? [])
    .filter((m) => m.id)
    .map((m) => ({ id: m.id!, quantity: m.quantity }))
  if (props.item.stars) run(() => cartStore.addStarItem(props.item.product_id))
  else run(() => cartStore.addItem(props.item.product_id, modifiers))
}
</script>

<template>
  <div class="rounded-3xl p-3" :class="item.gift ? 'bg-green-50' : 'bg-gray-50'">
    <div class="flex gap-3">
      <div class="w-[72px] shrink-0">
        <ProductImage
          :src="item.image_url"
          :alt="item.name"
          class="size-[72px] rounded-2xl"
          :class="{ 'opacity-50 grayscale': item.stopped || item.unavailable }"
        />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <h4 class="text-sm font-semibold leading-snug text-gray-950">{{ item.unavailable_reason === 'product_missing' ? t('cart.unavailableProduct') : item.name }}</h4>
          <button
            v-if="!item.gift"
            type="button"
            class="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-gray-400 transition-colors hover:text-red-500 cursor-pointer"
            :aria-label="t('cart.remove')"
            @click="run(() => cartStore.removeAllOfItem(item.key))"
          >
            <i class="pi pi-times text-sm" />
          </button>
        </div>

        <p v-if="item.modifiers?.length" class="mt-0.5 text-xs leading-snug text-gray-500">
          <template v-for="(modifier, index) in item.modifiers" :key="modifier.id ?? modifier.name">
            <template v-if="index">, </template>+ {{ modifier.name
            }}<template v-if="modifier.quantity > 1"> × {{ modifier.quantity }}</template>
          </template>
        </p>

        <StarRewardBadge :amount="item.stars_reward" :quantity="item.quantity" class="mt-2" />
        <span
          v-if="item.stopped || item.unavailable"
          class="mt-1.5 inline-block rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600"
        >
          {{ item.unavailable ? t('cart.unavailable') : t('cart.soldOut') }}
        </span>
      </div>
    </div>

    <div
      class="mt-3 flex items-center justify-between gap-2 border-t pt-3"
      :class="item.gift ? 'border-green-100' : 'border-gray-200'"
    >
      <div v-if="!item.gift" class="flex items-baseline gap-1.5 tabular-nums">
        <span
          class="text-base font-bold"
          :class="item.base_total > item.total_price ? 'text-green-700' : 'text-gray-950'"
        >
          {{
            item.stars
              ? '★ ' + (item.stars_price ?? 0) * item.quantity
              : formatPrice(item.total_price)
          }}
        </span>
        <span v-if="item.base_total > item.total_price" class="text-xs text-gray-400 line-through">
          {{ formatPrice(item.base_total) }}
        </span>
      </div>

      <span
        v-else
        class="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-green-700"
      >
        <i class="pi pi-gift text-xs" /> {{ t('cart.promoGift') }} · {{ item.quantity }}
      </span>

      <button
        v-if="giftPromotion"
        type="button"
        class="rounded-full px-3 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-40 cursor-pointer"
        :disabled="cartStore.isLoading"
        @click="openGiftChoice(giftPromotion.promotion_id)"
      >
        {{ t('promo.giftChoice.change') }}
      </button>

      <div v-if="!item.stopped && !item.unavailable && !item.gift" class="flex items-center gap-2">
        <button
          type="button"
          class="px-2 text-sm font-semibold text-primary transition-opacity hover:opacity-70 cursor-pointer"
          @click="handleEdit"
        >
          {{ t('cart.edit') }}
        </button>
        <div class="flex items-center gap-1 rounded-full bg-white p-0.5 shadow-xs">
          <button
            type="button"
            class="grid size-7 place-items-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 cursor-pointer"
            :aria-label="t('cart.decrease')"
            @click="handleDecrease"
          >
            <i class="pi pi-minus text-[10px]" />
          </button>
          <span class="min-w-8 text-center text-sm font-bold tabular-nums">
            {{ item.quantity }}
          </span>
          <button
            type="button"
            class="grid size-7 place-items-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 cursor-pointer"
            :aria-label="t('cart.increase')"
            @click="handleIncrease"
          >
            <i class="pi pi-plus text-[10px]" />
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="operationError"
      role="alert"
      class="mt-2 flex items-center gap-2 text-sm text-red-600"
    >
      <span>{{ operationError }}</span>
      <button type="button" class="underline" @click="retryAction && run(retryAction)">
        {{ t('common.retry') }}
      </button>
    </div>
  </div>
</template>
