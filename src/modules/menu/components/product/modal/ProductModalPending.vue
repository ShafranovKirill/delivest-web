<script setup lang="ts">
import { useMenuStore } from '@/modules/menu/stores/menu.store'
import { useI18n } from 'vue-i18n'

defineProps<{ error?: Error }>()
const menu = useMenuStore()
const { t } = useI18n()
function retryPage() {
  window.location.reload()
}
</script>

<template>
  <div
    class="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
    @click.self="menu.closeProductModal()"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="error ? t('menu.productLoadError') : t('menu.productLoading')"
      class="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
    >
      <button
        type="button"
        :aria-label="t('menu.returnToMenu')"
        class="absolute right-4 top-3 rounded-full p-2 text-xl"
        @click="menu.closeProductModal()"
      >
        ×
      </button>
      <p v-if="error" class="mt-5">{{ t('menu.productLoadError') }}</p>
      <div v-else role="status" class="py-10" aria-live="polite">
        {{ t('menu.productLoading') }}
      </div>
      <button
        v-if="error"
        type="button"
        class="mt-5 rounded-xl bg-primary px-5 py-3 text-primary-contrast"
        @click="retryPage"
      >
        {{ t('common.retry') }}
      </button>
    </div>
  </div>
</template>
