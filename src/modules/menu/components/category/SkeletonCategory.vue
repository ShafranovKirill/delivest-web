<script setup lang="ts">
import SkeletonProduct from '../product/SkeletonProduct.vue'
</script>

<template>
  <div class="my-4">
    <Skeleton class="mb-2 ml-2 w-55! h-8! rounded-4xl!"></Skeleton>
    <div
      class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-1 sm:gap-2 justify-items-center"
    >
      <SkeletonProduct v-for="i in 5" :key="i" />
    </div>
  </div>
</template>
