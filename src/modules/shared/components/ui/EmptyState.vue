<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  text?: string
}>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center text-center gap-3 py-14 px-6 rounded-3xl bg-gray-50 border border-dashed border-gray-200"
  >
    <span class="grid place-items-center size-14 rounded-2xl bg-white text-primary shadow-xs">
      <i :class="['pi', icon, 'text-2xl']" />
    </span>
    <div>
      <p class="text-base font-bold text-gray-900">{{ title }}</p>
      <p v-if="text" class="mt-1 text-sm text-gray-500 max-w-sm">{{ text }}</p>
    </div>
    <div v-if="$slots.default" class="mt-2">
      <slot />
    </div>
  </div>
</template>
