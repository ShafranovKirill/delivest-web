<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useMapStore } from '@/modules/branch/stores/map.store'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'

const { t } = useI18n()
const navigateTo = useBranchNavigation()
const { activeBranch, isOpenNow, closingTimeToday, workingHours } = storeToRefs(useBranchStore())
const { yandexOrgUrl } = storeToRefs(useMapStore())
</script>

<template>
  <div class="pt-4">
    <p class="text-lg font-semibold leading-snug text-gray-950 break-words">
      {{ activeBranch?.branch_info?.address || t('branch.info.noAddress') }}
    </p>

    <div class="mt-4 flex flex-col gap-5">
      <span class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-gray-700">
        <span
          class="size-2.5 rounded-full"
          :class="isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'"
        />
        {{ isOpenNow ? t('branch.info.open') : t('branch.info.closed') }}
        <span v-if="workingHours" class="text-xs text-gray-500 whitespace-nowrap">
          {{ t('branch.info.today', { time: closingTimeToday }) }}
        </span>
      </span>

      <div class="flex flex-wrap gap-x-6 gap-y-3 border-t border-gray-200 pt-4">
        <a
          v-if="yandexOrgUrl"
          :href="yandexOrgUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-strong transition-colors"
        >
          <i class="pi pi-directions" />
          {{ t('contacts.route') }}
        </a>
        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-primary transition-colors cursor-pointer"
          @click="navigateTo('branch-info')"
        >
          <i class="pi pi-calendar" />
          {{ t('contacts.about') }}
        </button>
      </div>
    </div>
  </div>
</template>
