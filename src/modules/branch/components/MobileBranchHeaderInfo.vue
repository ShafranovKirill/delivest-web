<script setup lang="ts">
import { computed } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useBranchOpening } from '@/modules/branch/composables/useBranchOpening'
import { addDays } from '@/modules/branch/utils/workWindow'
import { intlLocale } from '@/i18n'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const branchStore = useBranchStore()
const { isOpen, opensAt, now } = useBranchOpening()

const deliveryTime = computed(() => {
  return branchStore.activeBranch?.branch_info?.delivery_time
})

const closedUntil = computed(() => {
  const date = opensAt.value
  if (!date) return t('branch.closed.untilUnknown')

  const time = date.toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' })
  if (date.toDateString() === now.value.toDateString()) return t('branch.closed.until', { time })
  if (date.toDateString() === addDays(now.value, 1).toDateString()) {
    return t('branch.closed.untilTomorrow', { time })
  }

  const day = date.toLocaleDateString(intlLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return t('branch.closed.untilDay', { day, time })
})
</script>

<template>
  <div
    class="flex flex-col text-xs cursor-pointer select-none px-3 py-2 min-w-0 w-fit items-start mx-auto"
    @click="branchStore.openModal()"
  >
    <div class="flex items-center gap-1 font-medium leading-tight mb-0.5 min-w-0 max-w-full">
      <span class="text-(--p-primary-500) font-bold truncate min-w-0">
        {{ branchStore.activeBranch?.name || t('branch.select.title') }}
      </span>
      <i
        class="pi pi-angle-down shrink-0 text-sm text-(--p-primary-500) relative top-[1.5px] -left-0.5"
      />
    </div>

    <div
      v-if="!isOpen"
      class="flex items-center text-[11px] font-semibold leading-tight min-w-0 w-full text-red-600"
    >
      <span class="truncate">{{ closedUntil }}</span>
    </div>

    <div
      v-else
      class="flex items-center justify-start gap-1.5 text-[11px] text-gray-700 font-medium leading-tight min-w-0 w-full"
    >
      <template v-if="deliveryTime">
        <span class="shrink-0">~{{ t('branch.minutes', { minutes: deliveryTime }) }}</span>
        <span class="shrink-0">•</span>
      </template>

      <div
        class="flex items-center gap-0.5 text-gray-700! dark:text-gray-300 font-semibold shrink-0"
      >
        <span>4.78</span>
        <i class="pi pi-star-fill text-amber-400 text-[9px] relative -top-[0.5px]"></i>
      </div>
    </div>
  </div>
</template>
