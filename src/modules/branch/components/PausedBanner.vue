<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { intlLocale } from '@/i18n'
import { useBranchStore } from '../stores/branch.store'

const { t } = useI18n()
const { activeBranch } = storeToRefs(useBranchStore())

const intake = computed(() => activeBranch.value?.branch_info?.intake)
const paused = computed(() => intake.value?.mode === 'paused')
const until = computed(() => {
  const value = intake.value?.until
  if (!value) return null
  const time = new Date(value).toLocaleTimeString(intlLocale(), {
    hour: '2-digit',
    minute: '2-digit',
  })
  return t('branch.paused.until', { time })
})
</script>

<template>
  <div v-if="paused" class="w-full max-w-7xl mx-auto px-4 pb-4">
    <div
      class="flex items-center gap-3 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-red-800"
    >
      <i-tabler-clock-pause class="size-6 shrink-0" />
      <div class="min-w-0">
        <p class="font-bold leading-tight">
          {{ t('branch.paused.title') }}<template v-if="until"> · {{ until }}</template>
        </p>
        <p v-if="intake?.reason" class="mt-0.5 text-sm">{{ intake.reason }}</p>
      </div>
    </div>
  </div>
</template>
