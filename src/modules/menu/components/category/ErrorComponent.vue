<script setup lang="ts">
defineProps<{ onRetry: () => void }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 gap-4 text-center">
    <i class="pi pi-exclamation-circle text-4xl! text-red-500"></i>
    <div class="text-xl font-semibold">Не удалось загрузить меню</div>
    <p class="text-gray-500">Попробуйте обновить страницу или повторить запрос позже.</p>
    <Button
      label="Попробовать снова"
      icon="pi pi-refresh"
      @click="onRetry"
      class="p-button-outlined p-button-danger"
    />
  </div>
</template>
