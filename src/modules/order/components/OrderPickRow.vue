<script setup lang="ts">
defineProps<{ title: string; icon: string; text?: string | null; arrow?: 'up' | 'down' | 'none' }>()
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-2.5 rounded-2xl bg-gray-100 px-4 py-3 text-left font-normal tracking-normal transition-colors cursor-pointer hover:bg-gray-200/70 focus-visible:outline-2 focus-visible:outline-primary"
  >
    <span class="grid h-8 w-8 shrink-0 place-items-center text-gray-900" aria-hidden="true">
      <i class="pi text-[19px]!" :class="icon" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-sm font-medium leading-snug text-gray-900 sm:text-[15px]">{{
        title
      }}</span>
      <span v-if="text" class="block text-xs text-gray-500">{{ text }}</span>
    </span>
    <svg
      v-if="arrow !== 'none'"
      :class="{ 'rotate-90': arrow === 'down', '-rotate-90': arrow === 'up' }"
      class="h-7 w-7 shrink-0 text-gray-500"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m9 5 7 7-7 7"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>
