<script setup lang="ts">
defineProps<{ count: number; index: number; progress: number }>()
</script>

<template>
  <div class="flex gap-1">
    <span
      v-for="i in count"
      :key="i"
      class="h-0.75 flex-1 overflow-hidden rounded-full bg-white/35"
    >
      <span
        class="block h-full rounded-full bg-white"
        :style="{ width: `${i - 1 < index ? 100 : i - 1 === index ? progress * 100 : 0}%` }"
      />
    </span>
  </div>
</template>
