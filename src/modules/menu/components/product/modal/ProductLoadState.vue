<script setup lang="ts">
import { useMenuStore } from '@/modules/menu/stores/menu.store'
import { useI18n } from 'vue-i18n'
import ProductModalSkeleton from './ProductModalSkeleton.vue'
const menu = useMenuStore()
const { t } = useI18n()
</script>

<template>
  <ProductModalSkeleton v-if="menu.productLoadState === 'loading'" />
  <div v-else class="min-h-64 flex flex-col items-center justify-center gap-4 p-6 text-center" role="status" aria-live="polite">
      <p>{{ t(menu.productLoadState === 'unavailable' ? 'menu.productUnavailable' : 'menu.productLoadError') }}</p>
      <button v-if="menu.productLoadState === 'error'" type="button" class="rounded-xl bg-primary px-5 py-3 text-primary-contrast" @click="menu.retryProduct?.()">
        {{ t('common.retry') }}
      </button>
      <button type="button" class="underline" @click="menu.closeProductModal()">{{ t('menu.returnToMenu') }}</button>
  </div>
</template>
