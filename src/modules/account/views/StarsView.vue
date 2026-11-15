<script setup lang="ts">
import LoyaltyPanel from '../components/LoyaltyPanel.vue'
</script>

<template>
  <section class="flex min-h-full w-full flex-col bg-gray-200">
    <div class="sticky top-15 z-40 w-full bg-gray-200" aria-hidden="true">
      <div class="h-8 rounded-t-4xl bg-white sm:h-10 lg:rounded-t-[2.5rem]" />
    </div>
    <div class="flex-1 bg-white">
      <LoyaltyPanel />
    </div>
  </section>
</template>
