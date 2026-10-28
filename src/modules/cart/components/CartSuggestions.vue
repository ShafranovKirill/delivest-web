<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { getApiErrorMessage } from '@/api/errors'
import ProductImage from '@/modules/menu/components/product/ProductImage.vue'
import type { MenuProduct } from '@/modules/menu/api/menu.service'
import { useCartStore } from '../stores/cart.store'
import { useCartSuggestions } from '../composables/useCartSuggestions'

const { t } = useI18n()
const toast = useToast()
const cartStore = useCartStore()
const suggestions = useCartSuggestions()
const pendingId = ref<string | null>(null)

async function add(product: MenuProduct) {
  if (pendingId.value) return
  pendingId.value = product.id!
  try {
    await cartStore.addItem(product.id!)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('cart.title'),
      detail: getApiErrorMessage(error),
      life: 3000,
    })
  } finally {
    pendingId.value = null
  }
}
</script>

<template>
  <section v-if="suggestions.length" class="flex flex-col gap-2">
    <h4 class="text-sm font-bold text-gray-900">{{ t('cart.suggestions') }}</h4>
    <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x [scrollbar-width:none]">
      <article
        v-for="product in suggestions"
        :key="product.id"
        class="flex w-32 shrink-0 snap-start flex-col gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-2"
      >
        <ProductImage
          :src="product.photo_url"
          :alt="product.name"
          class="aspect-square w-full rounded-xl"
        />
        <span class="line-clamp-2 min-h-8 text-xs font-semibold leading-4 text-gray-900">
          {{ product.name }}
        </span>
        <button
          type="button"
          class="mt-auto flex h-8 items-center justify-center gap-1 rounded-full bg-primary-soft text-sm font-bold text-primary transition-colors hover:bg-primary-fill hover:text-white disabled:opacity-60 cursor-pointer"
          :disabled="pendingId !== null"
          @click="add(product)"
        >
          <i v-if="pendingId === product.id" class="pi pi-spin pi-spinner text-xs" />
          <i-tabler-plus v-else class="size-4" />
          {{ product.price }} ₽
        </button>
      </article>
    </div>
  </section>
</template>
