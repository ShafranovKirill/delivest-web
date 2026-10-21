<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ onRetry: () => void }>()

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 gap-4 text-center">
    <i class="pi pi-exclamation-circle text-4xl! text-red-500"></i>
    <div class="text-xl font-semibold">{{ t('menu.loadFailed') }}</div>
    <p class="text-gray-500">{{ t('menu.loadFailedHint') }}</p>
    <Button
      :label="t('common.retry')"
      icon="pi pi-refresh"
      @click="onRetry"
      class="p-button-outlined p-button-danger"
    />
  </div>
</template>
