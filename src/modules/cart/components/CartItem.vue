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
import { PRODUCT_QUERY_KEY } from '@/modules/menu/composables/useProductRoute'

const props = defineProps<{
  item: CartItem
}>()

const cartStore = useCartStore()
const { t } = useI18n()
const router = useRouter()
const branchStore = useBranchStore()
const desktopModalStore = useDesktopModalStore()
const mobileModalStore = useMobileModalStore()

function handleEdit() {
  const slug = branchStore.activeBranch?.slug
  if (!slug) return

  desktopModalStore.closeModal()
  mobileModalStore.closeModal()
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
  <div class="flex gap-3 rounded-3xl p-3" :class="item.gift ? 'bg-green-50' : 'bg-gray-50'">
    <ProductImage
      :src="item.image_url"
      :alt="item.name"
      class="size-[72px] shrink-0 rounded-2xl"
      :class="{ 'opacity-50 grayscale': item.stopped }"
    />

    <div class="flex min-w-0 flex-1 flex-col">
      <div class="flex items-start justify-between gap-2">
        <h4 class="text-sm font-semibold leading-snug text-gray-950">{{ item.name }}</h4>
        <div class="shrink-0 text-right tabular-nums">
          <p
            class="text-sm font-bold leading-snug"
            :class="
              item.gift || item.base_total > item.total_price ? 'text-green-700' : 'text-gray-950'
            "
          >
            {{ item.gift ? t('common.free') : formatPrice(item.total_price) }}
          </p>
          <p
            v-if="!item.gift && item.base_total > item.total_price"
            class="text-xs leading-tight text-gray-400 line-through"
          >
            {{ formatPrice(item.base_total) }}
          </p>
        </div>
      </div>

      <p v-if="item.modifiers?.length" class="mt-0.5 text-xs leading-snug text-gray-500">
        <template v-for="(modifier, index) in item.modifiers" :key="modifier.id ?? modifier.name">
          <template v-if="index">, </template>+ {{ modifier.name
          }}<template v-if="modifier.quantity > 1"> × {{ modifier.quantity }}</template>
        </template>
      </p>

      <div class="mt-auto flex items-end justify-between gap-2 pt-2">
        <span
          v-if="item.gift"
          class="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-green-700"
        >
          <i class="pi pi-gift text-xs" /> {{ t('cart.promoGift') }} · {{ item.quantity }}
        </span>

        <template v-else-if="item.stopped">
          <span class="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
            {{ t('cart.soldOut') }}
          </span>
          <button
            type="button"
            class="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 cursor-pointer"
            @click="cartStore.removeAllOfItem(item.key)"
          >
            {{ t('cart.removeShort') }}
          </button>
        </template>

        <template v-else>
          <span />
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-10 rounded-full bg-white px-4 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-100 cursor-pointer"
              @click="handleEdit"
            >
              {{ t('cart.edit') }}
            </button>
            <div class="flex items-center rounded-full bg-white p-1 shadow-xs">
              <button
                type="button"
                class="grid size-8 place-items-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 cursor-pointer"
                :aria-label="t('cart.decrease')"
                @click="handleDecrease"
              >
                <i class="pi pi-minus text-xs" />
              </button>
              <span class="min-w-7 text-center text-sm font-bold tabular-nums">
                {{ item.quantity }}
              </span>
              <button
                type="button"
                class="grid size-8 place-items-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 cursor-pointer"
                :aria-label="t('cart.increase')"
                @click="handleIncrease"
              >
                <i class="pi pi-plus text-xs" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
