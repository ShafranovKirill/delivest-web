<script setup lang="ts">
import { useMenuStore } from '@/modules/menu/stores/menu.store'
import { useI18n } from 'vue-i18n'
import ProductModalSkeleton from './ProductModalSkeleton.vue'

defineProps<{ error?: Error }>()
const menu = useMenuStore()
const { t } = useI18n()
function retryPage() {
  window.location.reload()
}
</script>

<template>
  <div
    class="fixed inset-0 z-100 flex items-end justify-center bg-black/50 md:items-center md:p-4"
    @click.self="menu.closeProductModal()"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="error ? t('menu.productLoadError') : t('menu.productLoading')"
      class="relative h-[94dvh] w-full overflow-y-auto rounded-t-4xl bg-white px-4 pt-10 pb-6 shadow-2xl md:h-auto md:max-h-[90dvh] md:max-w-4xl md:rounded-3xl md:p-8"
    >
      <div aria-hidden="true" class="absolute top-3 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-gray-400 md:hidden" />
      <button
        type="button"
        :aria-label="t('menu.returnToMenu')"
        class="absolute right-4 top-3 z-10 rounded-full bg-gray-100 px-3 py-1 text-xl"
        @click="menu.closeProductModal()"
      >
        ×
      </button>
      <div v-if="error" class="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
        <p>{{ t('menu.productLoadError') }}</p>
        <button
          type="button"
          class="rounded-xl bg-primary px-5 py-3 text-primary-contrast"
          @click="retryPage"
        >
          {{ t('common.retry') }}
        </button>
      </div>
      <ProductModalSkeleton v-else />
    </div>
  </div>
</template>
