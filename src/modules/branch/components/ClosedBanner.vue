<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { intlLocale } from '@/i18n'
import { useBranchOpening } from '../composables/useBranchOpening'
import { addDays } from '../utils/workWindow'
import { formatClock, sameDay } from '../utils/zonedTime'
import ClosedCafeIllustration from './ClosedCafeIllustration.vue'

const { t } = useI18n()
const { isOpen, isPaused, opensAt, now } = useBranchOpening()

const opening = computed(() => {
  if (isPaused.value) return t('branch.closed.noOpening')

  const date = opensAt.value
  if (!date) return t('branch.closed.noOpening')

  const time = formatClock(date, intlLocale(), { hour: '2-digit', minute: '2-digit' })
  if (sameDay(date, now.value)) return t('branch.closed.today', { time })
  if (sameDay(date, addDays(now.value, 1))) return t('branch.closed.tomorrow', { time })

  const day = formatClock(date, intlLocale(), {
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
      class="closed-banner relative isolate min-h-32 overflow-hidden rounded-3xl p-4 sm:min-h-36 sm:p-5"
    >
      <div class="relative z-10 min-w-0 pr-[clamp(5.5rem,29vw,13rem)]">
        <p class="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
          {{ t('branch.closed.title') }}
        </p>
        <p class="mt-2 text-base font-semibold leading-snug text-primary-strong">{{ opening }}</p>
        <p v-if="opensAt" class="mt-1.5 text-sm leading-snug text-gray-700">
          {{ t('branch.closed.hint') }}
        </p>
      </div>
      <ClosedCafeIllustration
        class="pointer-events-none absolute bottom-1 right-2 z-0 w-[clamp(4.5rem,24vw,11.5rem)] text-primary-strong sm:bottom-2 sm:right-4"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style scoped>
.closed-banner {
  --closed-bg: color-mix(in srgb, var(--color-primary) 18%, var(--surface-card, white));
  --closed-bg-deep: color-mix(in srgb, var(--color-primary) 34%, var(--surface-card, white));
  background: var(--closed-bg);
}
</style>
