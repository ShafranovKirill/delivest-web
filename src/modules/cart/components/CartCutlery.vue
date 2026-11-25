<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useCartStore } from '../stores/cart.store'
import CutleryIllustration from './CutleryIllustration.vue'

const cartStore = useCartStore()
const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-3 rounded-3xl bg-gray-50 px-3 py-3">
    <CutleryIllustration class="h-11 w-12 shrink-0 text-(--p-primary-500)" />
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold leading-snug text-gray-950">{{ t('cart.cutlery.title') }}</p>
    </div>
    <div
      class="flex shrink-0 items-center gap-1 rounded-full bg-white p-0.5 text-gray-950 shadow-xs"
      role="group"
      :aria-label="t('cart.cutlery.title')"
    >
      <button
        type="button"
        class="grid size-7 place-items-center rounded-full text-gray-700 transition-colors enabled:hover:bg-gray-100 cursor-pointer disabled:cursor-default disabled:opacity-40"
        :aria-label="t('cart.cutlery.decrease')"
        :disabled="cartStore.cutleryCount === 0"
        @click="cartStore.setCutleryCount(cartStore.cutleryCount - 1)"
      >
        <i class="pi pi-minus text-[10px]" aria-hidden="true" />
      </button>
      <span class="min-w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">{{
        cartStore.cutleryCount
      }}</span>
      <button
        type="button"
        class="grid size-7 place-items-center rounded-full text-gray-700 transition-colors enabled:hover:bg-gray-100 cursor-pointer disabled:cursor-default disabled:opacity-40"
        :aria-label="t('cart.cutlery.increase')"
        :disabled="cartStore.cutleryCount === 99"
        @click="cartStore.setCutleryCount(cartStore.cutleryCount + 1)"
      >
        <i class="pi pi-plus text-[10px]" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
