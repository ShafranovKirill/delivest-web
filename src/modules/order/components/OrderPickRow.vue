<script setup lang="ts">
defineProps<{ title: string; text?: string | null }>()
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 text-left transition-colors cursor-pointer hover:border-primary"
  >
    <span class="min-w-0 flex-1">
      <span class="block text-sm font-semibold text-gray-900">{{ title }}</span>
      <span v-if="text" class="mt-0.5 block text-sm text-gray-500">{{ text }}</span>
    </span>
    <i class="pi pi-angle-right shrink-0 text-lg text-gray-400" />
  </button>
</template>
