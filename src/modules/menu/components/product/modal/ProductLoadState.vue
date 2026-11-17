<script setup lang="ts">
import { useMenuStore } from '@/modules/menu/stores/menu.store'
import { useI18n } from 'vue-i18n'
const menu = useMenuStore()
const { t } = useI18n()
</script>

<template>
  <div class="min-h-64 flex flex-col items-center justify-center gap-4 p-6 text-center" role="status" aria-live="polite">
    <template v-if="menu.productLoadState === 'loading'">
      <div class="h-32 w-32 animate-pulse rounded-3xl bg-gray-100" />
      <div class="h-6 w-48 animate-pulse rounded bg-gray-100" />
      <span class="sr-only">{{ t('menu.productLoading') }}</span>
    </template>
    <template v-else>
      <p>{{ t(menu.productLoadState === 'unavailable' ? 'menu.productUnavailable' : 'menu.productLoadError') }}</p>
      <button v-if="menu.productLoadState === 'error'" type="button" class="rounded-xl bg-primary px-5 py-3 text-primary-contrast" @click="menu.retryProduct?.()">
        {{ t('common.retry') }}
      </button>
      <button type="button" class="underline" @click="menu.closeProductModal()">{{ t('menu.returnToMenu') }}</button>
    </template>
  </div>
</template>
