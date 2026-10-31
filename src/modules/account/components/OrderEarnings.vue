<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useStarsLabel } from '../composables/useStarsLabel'
defineProps<{ amount?: number; status: string }>()
const { t } = useI18n()
const label = useStarsLabel()
</script>
<template>
  <div
    v-if="amount && amount > 0 && status !== 'cancelled'"
    class="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700"
  >
    <i class="pi pi-star-fill" aria-hidden="true" />
    {{
      status === 'completed'
        ? t('loyalty.earned', { stars: label(amount) })
        : '+' + t('loyalty.afterCompleted', { stars: label(amount) })
    }}
  </div>
</template>
