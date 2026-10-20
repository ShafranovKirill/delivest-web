<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  onRetry?: () => void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="p-6 text-center bg-white rounded-lg shadow my-4">
    <p class="text-red-500 mb-4">{{ t('common.loadFailed') }}</p>
    <button
      v-if="onRetry"
      @click="onRetry"
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      {{ t('common.retry') }}
    </button>
  </div>
</template>
