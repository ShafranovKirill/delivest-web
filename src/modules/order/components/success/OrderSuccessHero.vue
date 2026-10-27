<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Order } from '../../api/order.service'

defineProps<{ order: Order | null }>()

const { t } = useI18n()
</script>

<template>
  <div
    class="flex flex-col items-center gap-4 rounded-4xl bg-primary-soft px-6 py-8 text-center sm:py-10"
  >
    <span class="relative grid size-20 place-items-center">
      <span
        class="absolute inset-0 animate-ping rounded-full bg-primary/30 [animation-iteration-count:2]"
      />
      <span
        class="relative grid size-20 place-items-center rounded-full bg-primary text-white shadow-lg"
      >
        <i class="pi pi-check text-3xl" />
      </span>
    </span>

    <div class="flex flex-col items-center gap-2">
      <h2 class="text-2xl font-extrabold text-gray-950 sm:text-3xl">
        {{ t('order.success.title') }}
      </h2>
      <span
        v-if="order?.number"
        class="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-gray-900 shadow-xs"
      >
        {{ t('order.number', { number: order.number }) }}
      </span>
    </div>
  </div>
</template>
