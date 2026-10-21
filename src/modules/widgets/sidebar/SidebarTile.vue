<script setup lang="ts">
defineProps<{ icon: string; title: string; subtitle?: string }>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <div
    role="button"
    tabindex="0"
    class="flex items-center gap-3 w-full rounded-2xl bg-gray-100 p-3 cursor-pointer select-none transition-colors hover:bg-gray-200/60"
    @click="emit('click')"
    @keydown.enter="emit('click')"
  >
    <span class="size-10 shrink-0 rounded-full bg-white grid place-items-center text-primary">
      <i :class="['pi', icon, 'text-lg']" />
    </span>

    <span class="flex flex-col min-w-0 flex-1">
      <span class="text-[15px] font-semibold text-gray-900 leading-tight truncate">
        {{ title }}
      </span>
      <span class="mt-0.5 flex items-center gap-1 text-xs text-gray-500 truncate">
        <slot name="subtitle">{{ subtitle }}</slot>
      </span>
    </span>

    <slot name="trailing" />
  </div>
</template>
