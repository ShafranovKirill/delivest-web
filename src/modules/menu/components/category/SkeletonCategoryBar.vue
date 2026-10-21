<script setup lang="ts">
const widths = ['6rem', '8rem', '5rem', '7rem', '9rem', '6rem']
</script>

<template>
  <div class="flex gap-4 overflow-hidden" aria-busy="true">
    <Skeleton
      v-for="(width, index) in widths"
      :key="index"
      :width="width"
      height="2.5rem"
      border-radius="2rem"
      class="shrink-0"
    />
  </div>
</template>
