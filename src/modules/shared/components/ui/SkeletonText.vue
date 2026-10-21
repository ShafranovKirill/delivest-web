<script setup lang="ts">
withDefaults(defineProps<{ paragraphs?: number }>(), { paragraphs: 4 })

const widths = ['100%', '96%', '88%', '64%']
</script>

<template>
  <div class="flex flex-col gap-6" aria-busy="true">
    <div v-for="i in paragraphs" :key="i" class="flex flex-col gap-2">
      <Skeleton width="40%" height="1.4rem" class="mb-1" />
      <Skeleton v-for="width in widths" :key="width" :width="width" height="0.9rem" />
    </div>
  </div>
</template>
