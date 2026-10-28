<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useMapStore } from '@/modules/branch/stores/map.store'
import { useBranchNavigation } from '@/modules/branch/composables/useBranchNavigation'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'

const { t } = useI18n()
const navigateTo = useBranchNavigation()
const { activeBranch, isOpenNow, closingTimeToday, workingHours } = storeToRefs(useBranchStore())
const { yandexOrgUrl } = storeToRefs(useMapStore())
</script>

<template>
  <SurfaceCard icon="pi-map-marker" :label="t('contacts.place')">
    <template #value>
      {{ activeBranch?.branch_info?.address || t('branch.info.noAddress') }}
    </template>

    <div class="flex flex-col gap-4">
      <span class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-gray-700">
        <span
          class="size-2.5 rounded-full"
          :class="isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'"
        />
        {{ isOpenNow ? t('branch.info.open') : t('branch.info.closed') }}
        <span
          v-if="workingHours"
          class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-xs whitespace-nowrap"
        >
          {{ t('branch.info.today', { time: closingTimeToday }) }}
        </span>
      </span>

      <div class="flex flex-wrap gap-2">
        <a
          v-if="yandexOrgUrl"
          :href="yandexOrgUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 rounded-full bg-white border border-gray-100 px-4 py-2.5 text-sm font-semibold text-primary shadow-xs hover:border-primary transition-colors"
        >
          <i class="pi pi-directions" />
          {{ t('contacts.route') }}
        </a>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-white border border-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-xs hover:border-primary hover:text-primary transition-colors cursor-pointer"
          @click="navigateTo('branch-info')"
        >
          <i class="pi pi-calendar" />
          {{ t('contacts.about') }}
        </button>
      </div>
    </div>
  </SurfaceCard>
</template>
