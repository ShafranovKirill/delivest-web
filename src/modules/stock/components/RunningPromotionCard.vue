<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { intlLocale } from '@/i18n'
import type { RunningPromotion } from '../api/promotion.service'

const props = defineProps<{ promotion: RunningPromotion }>()
const { t } = useI18n()

const endsAt = computed(() =>
  props.promotion.ends_at
    ? new Date(props.promotion.ends_at).toLocaleDateString(intlLocale(), {
        day: 'numeric',
        month: 'long',
      })
    : null,
)
</script>

<template>
  <article class="flex gap-4 rounded-3xl bg-gray-50 border border-gray-100 p-4 sm:p-5">
    <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
      <i-tabler-rosette-discount class="size-6" />
    </span>
    <div class="min-w-0 flex-1">
      <h3 class="text-base font-bold text-gray-950 leading-snug">{{ promotion.name }}</h3>
      <p v-if="promotion.description" class="mt-1 text-sm text-gray-600 leading-relaxed">
        {{ promotion.description }}
      </p>
      <div class="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span class="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
          {{ t('stock.automatic') }}
        </span>
        <span v-if="endsAt" class="rounded-full bg-white px-2.5 py-1 text-gray-600 shadow-xs">
          {{ t('stock.until', { date: endsAt }) }}
        </span>
      </div>
    </div>
  </article>
</template>
