<script setup lang="ts" generic="T extends string">
defineProps<{
  options: Array<{ value: T; label: string; icon?: string }>
  columns?: 2 | 3 | 4
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <div
    class="grid gap-2"
    :class="{
      'grid-cols-2': columns === 2 || !columns,
      'grid-cols-3': columns === 3,
      'grid-cols-2 sm:grid-cols-4': columns === 4,
    }"
    role="radiogroup"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="model === option.value"
      class="flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-sm font-semibold transition-colors cursor-pointer"
      :class="[
        model === option.value
          ? 'bg-white text-gray-950 border-primary-fill'
          : 'bg-white text-gray-700 border-gray-200 hover:border-primary',
        columns === 3 ? 'flex-col gap-1 px-2 sm:flex-row sm:gap-2 sm:px-3' : '',
      ]"
      @click="model = option.value"
    >
      <i v-if="option.icon" :class="['pi', option.icon]" />
      <span class="truncate">{{ option.label }}</span>
    </button>
  </div>
</template>
