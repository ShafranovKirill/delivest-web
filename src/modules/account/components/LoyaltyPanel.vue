<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMenuQuery } from '@/modules/menu/composables/useMenuQuery'
import ProductImage from '@/modules/menu/components/product/ProductImage.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLoyaltyModalStore } from '../stores/loyalty.store'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useLoyaltyQuery } from '../composables/useLoyaltyQuery'
import { useStarsLabel } from '../composables/useStarsLabel'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { getApiErrorMessage } from '@/api/errors'
import AuthRequired from '@/modules/auth/components/AuthRequired.vue'

const { t } = useI18n()
const { data, isLoading, isError, refetch } = useLoyaltyQuery()
const label = useStarsLabel()
const cart = useCartStore()
const toast = useToast()
const busy = ref(false)
const auth = useAuthStore()
const modal = useLoyaltyModalStore()
const { data: menu } = useMenuQuery()
const menuProducts = computed(
  () => new Map((menu.value ?? []).flatMap((c) => c.products ?? []).map((p) => [p.id, p])),
)
const products = computed(() =>
  [...(data.value?.products ?? [])].sort(
    (a, b) => Number(b.stars_price <= available.value) - Number(a.stars_price <= available.value),
  ),
)
const inCart = (id: string) =>
  cart.items.filter((i) => i.stars && i.product_id === id).reduce((sum, i) => sum + i.quantity, 0)
const available = computed(() =>
  Math.max(
    (data.value?.balance ?? 0) -
      cart.items.reduce(
        (sum, item) =>
          sum + ((item as typeof item & { stars_price?: number }).stars_price ?? 0) * item.quantity,
        0,
      ),
    0,
  ),
)

async function add(id: string) {
  busy.value = true
  try {
    await cart.addStarItem(id)
  } catch (error) {
    toast.add({ severity: 'error', summary: getApiErrorMessage(error), life: 4000 })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="min-h-full bg-white px-4 pb-12 sm:px-8">
    <header class="mx-auto flex max-w-5xl flex-col items-center py-8 text-center sm:py-12">
      <span class="mb-4 grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
        <i class="pi pi-star-fill text-3xl" aria-hidden="true" />
      </span>
      <p v-if="auth.isAuthenticated" class="text-sm font-medium text-gray-500">{{ t('loyalty.yourBalance') }}</p>
      <p v-if="auth.isAuthenticated" class="mt-2 text-5xl font-extrabold tabular-nums tracking-tight text-gray-950 sm:text-6xl">
        {{ data?.balance ?? '…' }}
        <span class="text-3xl text-primary">★</span>
      </p>
      <p class="mt-3 max-w-md text-sm text-gray-500">{{ t('loyalty.shopHint') }}</p>
    </header>
    <AuthRequired :text="t('loyalty.signInHint')">
      <main class="mx-auto max-w-5xl space-y-6">
        <div v-if="isLoading" role="status" class="grid gap-4 grid-cols-2 sm:grid-cols-3">
          <div v-for="n in 3" :key="n" class="h-64 animate-pulse rounded-3xl bg-gray-100" />
        </div>
        <button v-else-if="isError" class="rounded-xl border p-3" @click="refetch()">
          {{ t('common.retry') }}
        </button>
        <template v-else-if="data?.enabled">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-extrabold sm:text-2xl">{{ t('loyalty.shop') }}</h2>
            <span class="text-sm text-gray-500">{{
              t('loyalty.available', { stars: label(available) })
            }}</span>
          </div>
          <p v-if="!products.length" class="rounded-3xl bg-gray-50 p-8 text-center text-gray-500">
            {{ t('loyalty.noProducts') }}
          </p>
          <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            <article
              v-for="product in products"
              :key="product.id"
              class="flex flex-col gap-3 rounded-3xl bg-gray-50 p-3 sm:p-4"
            >
              <ProductImage
                :src="menuProducts.get(product.id)?.photo_url"
                :alt="product.name"
                class="aspect-square w-full rounded-2xl object-contain"
              />
              <h3 class="grow text-sm font-bold leading-snug text-gray-950 sm:text-base">
                {{ product.name }}
              </h3>
              <p class="flex items-center gap-1.5 text-lg font-extrabold text-primary">
                <i class="pi pi-star-fill text-sm" aria-hidden="true" />{{ product.stars_price }}
              </p>
              <p v-if="inCart(product.id)" class="text-xs font-semibold text-primary">
                {{ t('loyalty.inCart', { count: inCart(product.id) }) }}
              </p>
              <Button
                :disabled="
                  busy || product.stars_price > available || menuProducts.get(product.id)?.stopped
                "
                :label="
                  product.stars_price > available ? t('loyalty.insufficient') : t('loyalty.take')
                "
                rounded
                class="w-full !text-xs sm:!text-sm"
                @click="add(product.id)"
              />
            </article>
          </div>
          <button
            v-if="modal.isOpen && cart.items.some((i) => i.stars)"
            type="button"
            class="w-full rounded-full bg-primary-fill px-6 py-3 font-bold text-white cursor-pointer"
            @click="modal.close"
          >
            {{ t('loyalty.continueShopping') }}
          </button>
          <details v-if="data.history.length" class="border-t border-gray-100 pt-5">
            <summary class="cursor-pointer text-sm font-semibold text-gray-500">
              {{ t('loyalty.history') }}
            </summary>
            <ul class="mt-3 divide-y divide-gray-100">
              <li
                v-for="entry in data.history"
                :key="entry.id"
                class="flex justify-between py-3 text-sm"
              >
                <time>{{ new Date(entry.inserted_at).toLocaleDateString() }}</time>
                <span :class="entry.amount > 0 ? 'text-green-700' : 'text-gray-500'"
                  >{{ entry.amount > 0 ? '+' : '' }}{{ label(entry.amount) }}</span
                >
              </li>
            </ul>
          </details>
        </template>
      </main>
    </AuthRequired>
  </div>
</template>
