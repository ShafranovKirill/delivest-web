<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div role="status" :aria-label="t('menu.productLoading')" class="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
    <div class="flex w-full justify-center md:items-start">
      <div class="flex aspect-square w-full max-w-50 items-center justify-center rounded-4xl bg-gray-100 sm:max-w-64 md:max-w-87.5">
        <img
          src="/placeholder/product-placeholder.svg"
          alt=""
          aria-hidden="true"
          class="size-3/4 object-contain opacity-70 motion-safe:animate-[spin_8s_linear_infinite]"
        />
      </div>
    </div>
    <div class="flex min-w-0 flex-col gap-3 pt-3 md:min-h-75 md:pt-0">
      <div class="h-7 w-3/4 rounded-lg bg-gray-100 motion-safe:animate-pulse md:mr-12" />
      <div class="h-7 w-1/2 rounded-lg bg-gray-100 motion-safe:animate-pulse" />
      <div class="mt-3 h-4 w-full rounded bg-gray-100 motion-safe:animate-pulse" />
      <div class="h-4 w-2/3 rounded bg-gray-100 motion-safe:animate-pulse" />
      <div class="mt-auto h-12 w-full rounded-2xl bg-gray-100 motion-safe:animate-pulse" />
    </div>
  </div>
</template>
