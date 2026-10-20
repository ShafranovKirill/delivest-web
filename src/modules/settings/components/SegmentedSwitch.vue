<script setup lang="ts" generic="T extends string">
defineProps<{
  label: string
  options: Array<{ value: T; label: string; icon?: string }>
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-xs font-medium text-gray-500">{{ label }}</span>
    <div class="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-gray-100 p-1" role="radiogroup">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="radio"
        :aria-checked="model === option.value"
        class="flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors"
        :class="
          model === option.value
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-800'
        "
        @click="model = option.value"
      >
        <i v-if="option.icon" :class="['pi', option.icon, 'text-xs']" />
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>
