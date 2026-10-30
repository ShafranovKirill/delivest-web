<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { intlLocale } from '@/i18n'
import { useBranchStore } from '../stores/branch.store'
import { useBranchOpening } from '../composables/useBranchOpening'
import { addDays } from '../utils/workWindow'

const { t } = useI18n()
const branchStore = useBranchStore()
const { workingHours, formattedScheduleList, closingTimeToday } = storeToRefs(branchStore)
const { isOpen, opensAt, closesAt, now } = useBranchOpening()

const expanded = ref(false)

function clock(date: Date) {
  return date.toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' })
}

const status = computed(() => {
  if (isOpen.value && closesAt.value) {
    return {
      title: t('branch.info.openNow'),
      hint: t('branch.info.openUntil', { time: clock(closesAt.value) }),
    }
  }
  if (isOpen.value) return { title: t('branch.info.openNow'), hint: closingTimeToday.value }

  const date = opensAt.value
  if (!date) return { title: t('branch.info.closed'), hint: t('branch.schedule.notSet') }

  const time = clock(date)
  if (date.toDateString() === now.value.toDateString()) {
    return { title: t('branch.info.closed'), hint: t('branch.closed.today', { time }) }
  }
  if (date.toDateString() === addDays(now.value, 1).toDateString()) {
    return { title: t('branch.info.closed'), hint: t('branch.closed.tomorrow', { time }) }
  }
  const day = date.toLocaleDateString(intlLocale(), { weekday: 'long' })
  return { title: t('branch.info.closed'), hint: t('branch.closed.later', { day, time }) }
})

const today = computed(() => formattedScheduleList.value.find((item) => item.isToday) ?? null)
</script>

<template>
  <div class="rounded-3xl border border-gray-100 bg-gray-50 p-4 sm:p-6">
    <div class="flex items-center gap-3 sm:gap-4">
      <span
        class="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-xs"
      >
        <i class="pi pi-clock text-lg" />
      </span>

      <div class="min-w-0 flex-1">
        <p class="flex items-center gap-2 text-base font-bold text-gray-950">
          <span
            class="size-2.5 shrink-0 rounded-full"
            :class="isOpen ? 'animate-pulse bg-emerald-500' : 'bg-red-500'"
          />
          {{ status.title }}
        </p>
        <p class="text-sm font-medium text-gray-500">{{ status.hint }}</p>
      </div>

      <button
        v-if="workingHours"
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:text-primary"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        <span class="hidden sm:inline">{{ t('branch.info.week') }}</span>
        <i
          class="pi pi-angle-down text-base transition-transform duration-300"
          :class="{ 'rotate-180': expanded }"
        />
      </button>
    </div>

    <div v-if="today && today.enabled && !expanded" class="mt-3 text-sm text-gray-600">
      {{ t('branch.info.todayHours') }}
      <span class="font-semibold tabular-nums text-gray-900"
        >{{ today.open }} — {{ today.close }}</span
      >
    </div>

    <div
      v-if="workingHours && formattedScheduleList.length"
      class="grid transition-[grid-template-rows] duration-300 ease-out"
      :class="expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <ul
        class="grid min-h-0 grid-cols-1 gap-2 overflow-hidden sm:grid-cols-2"
        :class="{ 'mt-4': expanded }"
      >
        <li
          v-for="item in formattedScheduleList"
          :key="item.day"
          class="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm"
          :class="item.isToday ? 'border-primary/20 bg-primary-soft' : 'border-gray-100 bg-white'"
        >
          <span class="font-medium" :class="item.isToday ? 'text-primary' : 'text-gray-700'">
            {{ item.day }}
            <span v-if="item.isToday" class="ml-1 text-xs font-semibold">
              · {{ t('branch.info.todayMark') }}
            </span>
          </span>
          <span v-if="item.enabled" class="font-semibold tabular-nums text-gray-900">
            {{ item.open }} — {{ item.close }}
          </span>
          <span v-else class="font-medium text-gray-400">{{ t('branch.schedule.dayOff') }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
