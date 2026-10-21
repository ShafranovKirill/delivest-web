<script setup lang="ts">
withDefaults(defineProps<{ count?: number; itemClass?: string }>(), {
  count: 3,
  itemClass: 'h-20 rounded-3xl!',
})
</script>

<template>
  <div aria-busy="true">
    <Skeleton v-for="i in count" :key="i" width="100%" :class="itemClass" />
  </div>
</template>
