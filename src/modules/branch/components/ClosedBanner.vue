<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { intlLocale } from '@/i18n'
import { useBranchOpening } from '../composables/useBranchOpening'
import { addDays } from '../utils/workWindow'

const { t } = useI18n()
const { isOpen, opensAt, now } = useBranchOpening()

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

const opening = computed(() => {
  const date = opensAt.value
  if (!date) return t('branch.closed.noOpening')

  const time = date.toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' })
  if (sameDay(date, now.value)) return t('branch.closed.today', { time })
  if (sameDay(date, addDays(now.value, 1))) return t('branch.closed.tomorrow', { time })

  const day = date.toLocaleDateString(intlLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
  return t('branch.closed.later', { day, time })
})
</script>

<template>
  <div v-if="!isOpen" class="w-full max-w-7xl mx-auto px-4 pb-4">
    <div
      class="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
    >
      <i-tabler-moon class="size-6 shrink-0" />
      <div class="min-w-0">
        <p class="font-bold leading-tight">{{ t('branch.closed.title') }} · {{ opening }}</p>
        <p v-if="opensAt" class="mt-0.5 text-sm">{{ t('branch.closed.hint') }}</p>
      </div>
    </div>
  </div>
</template>
