<script setup lang="ts">
import { computed, ref } from 'vue'
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
  <AuthRequired :text="t('loyalty.title')">
    <main class="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 class="text-3xl font-extrabold">{{ t('loyalty.title') }}</h1>
      <p v-if="isLoading" role="status">…</p>
      <button v-else-if="isError" class="rounded-xl border p-3" @click="refetch()">
        {{ t('common.retry') }}
      </button>
      <template v-else-if="data?.enabled">
        <div class="rounded-3xl bg-amber-50 p-6 text-2xl font-bold text-amber-800">
          <i class="pi pi-star-fill mr-2" />{{ label(data.balance) }}
        </div>
        <h2 class="text-xl font-bold">{{ t('loyalty.shop') }}</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <article
            v-for="product in data.products"
            :key="product.id"
            class="space-y-4 rounded-3xl border border-amber-100 p-5"
          >
            <h3 class="text-lg font-semibold">{{ product.name }}</h3>
            <Button
              :disabled="busy || product.stars_price > available"
              :label="
                product.stars_price > available
                  ? t('loyalty.insufficient')
                  : t('loyalty.add', { stars: label(product.stars_price) })
              "
              icon="pi pi-star-fill"
              @click="add(product.id)"
            />
          </article>
        </div>
        <h2 class="text-xl font-bold">{{ t('loyalty.history') }}</h2>
        <ul class="divide-y">
          <li v-for="entry in data.history" :key="entry.id" class="flex justify-between py-3">
            <time>{{ new Date(entry.inserted_at).toLocaleDateString() }}</time>
            <span :class="entry.amount > 0 ? 'text-green-700' : 'text-amber-700'"
              >{{ entry.amount > 0 ? '+' : '' }}{{ label(entry.amount) }}</span
            >
          </li>
        </ul>
      </template>
    </main>
  </AuthRequired>
</template>
