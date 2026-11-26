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
  if (sameDay(date, now.value)) return t('branch.closed.todayBanner', { time })
  if (sameDay(date, addDays(now.value, 1))) return t('branch.closed.tomorrowBanner', { time })

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
      class="closed-banner relative isolate flex min-h-32 items-center overflow-hidden rounded-3xl p-4 sm:min-h-36 sm:p-5"
    >
      <div class="relative z-10 min-w-0 pr-[clamp(5rem,24vw,7.1875rem)]">
        <p class="closed-banner__title text-xl font-semibold leading-tight sm:text-2xl">
          {{ t('branch.closed.title') }}
        </p>
        <p class="mt-2 text-base leading-snug text-gray-700">{{ opening }}</p>
      </div>
      <ClosedCafeIllustration
        class="pointer-events-none absolute right-3 top-1/2 z-0 h-[clamp(4.5rem,24vw,7.1875rem)] w-auto -translate-y-1/2 text-primary-strong sm:right-4"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style scoped>
.closed-banner {
  --closed-bg: color-mix(in srgb, var(--color-primary) 18%, var(--surface-card, white));
  background: var(--closed-bg);
}

.closed-banner__title {
  color: color-mix(in srgb, var(--color-primary) 55%, var(--color-gray-600));
}
</style>
