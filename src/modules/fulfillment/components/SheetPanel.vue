<script setup lang="ts">
defineProps<{ floating: boolean }>()
</script>

<template>
  <div
    class="overflow-y-auto"
    :class="
      floating
        ? 'relative z-10 -mt-6 rounded-t-3xl bg-white shadow-[0_-12px_32px_-8px_rgba(0,0,0,0.3)] ring-1 ring-black/5 dark:ring-white/10'
        : 'flex-1 pt-20'
    "
  >
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4">
      <slot />
    </div>
  </div>
</template>
