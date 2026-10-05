<script setup lang="ts">
defineProps<{
  onRetry?: () => void
}>()
</script>

<template>
  <div class="p-6 text-center bg-white rounded-lg shadow my-4">
    <p class="text-red-500 mb-4">Произошла ошибка при загрузке данных.</p>
    <button
      v-if="onRetry"
      @click="onRetry"
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      Повторить попытку
    </button>
  </div>
</template>
