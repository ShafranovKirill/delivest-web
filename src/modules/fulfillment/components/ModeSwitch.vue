<script setup lang="ts" generic="T extends string">
defineProps<{ options: Array<{ value: T; label: string }> }>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <div
    class="flex rounded-full bg-white p-1 shadow-lg ring-1 ring-black/10 dark:ring-white/10"
    role="radiogroup"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="model === option.value"
      class="h-9 flex-1 rounded-full text-sm font-semibold transition-colors cursor-pointer"
      :class="
        model === option.value ? 'bg-primary-fill text-white' : 'text-gray-600 hover:text-gray-900'
      "
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
