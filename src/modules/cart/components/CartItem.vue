<script setup lang="ts">
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
const { t } = useI18n()
const router = useRouter()
const menuStore = useMenuStore()
const branchStore = useBranchStore()
const desktopModalStore = useDesktopModalStore()
const mobileModalStore = useMobileModalStore()

function handleEdit() {
  const slug = branchStore.activeBranch?.slug
  if (!slug) return

  desktopModalStore.closeModal()
  mobileModalStore.closeModal()
  menuStore.returnToCart = true
  router.push({
    name: 'menu',
    params: { slug },
    query: { [PRODUCT_QUERY_KEY]: props.item.product_id },
  })
}

function handleDecrease() {
  if (props.item.quantity > 1) {
    cartStore.removeItem(props.item.key)
  } else {
    cartStore.removeAllOfItem(props.item.key)
  }
}

function handleIncrease() {
  const modifiers = (props.item.modifiers ?? [])
    .filter((m) => m.id)
    .map((m) => ({ id: m.id!, quantity: m.quantity }))
  cartStore.addItem(props.item.product_id, modifiers)
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
          :class="{ 'opacity-50 grayscale': item.stopped }"
        />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <h4 class="text-sm font-semibold leading-snug text-gray-950">{{ item.name }}</h4>
          <button
            v-if="!item.gift"
            type="button"
            class="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-gray-400 transition-colors hover:text-red-500 cursor-pointer"
            :aria-label="t('cart.remove')"
            @click="cartStore.removeAllOfItem(item.key)"
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

        <span
          v-if="item.stopped"
          class="mt-1.5 inline-block rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600"
        >
          {{ t('cart.soldOut') }}
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
          {{ formatPrice(item.total_price) }}
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

      <div v-if="!item.stopped && !item.gift" class="flex items-center gap-2">
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
  </div>
</template>
