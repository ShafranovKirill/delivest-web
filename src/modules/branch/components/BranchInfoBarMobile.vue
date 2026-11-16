<script setup lang="ts">
import { computed } from 'vue'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useSidebarStore } from '@/modules/widgets/sidebar/sidebar.store'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const branchStore = useBranchStore()
const franchiseStore = useFranchiseStore()
const rating = computed(
  () =>
    branchStore.activeBranch?.branch_info?.manual_rating ?? franchiseStore.rating?.value ?? null,
)
const sidebarStore = useSidebarStore()

const deliveryTime = computed(() => branchStore.activeBranch?.branch_info?.delivery_time)

function openBranchModal() {
  sidebarStore.setSidebarVisible(false)
  branchStore.openModal()
}
</script>

<template>
  <button
    type="button"
    class="flex w-full cursor-pointer flex-col gap-2 rounded-2xl bg-primary-soft p-4 text-left transition-colors hover:bg-primary-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    @click="openBranchModal"
  >
    <span class="text-xs font-semibold uppercase tracking-wide text-primary">{{
      t('branch.yourBranch')
    }}</span>
    <span class="flex w-full items-start justify-between gap-3">
      <i class="pi pi-map-marker mt-0.5 text-lg text-primary" aria-hidden="true" />
      <span class="min-w-0 flex-1">
        <span class="block break-words text-base font-semibold leading-snug text-gray-950">{{
          branchStore.activeBranch?.name || t('branch.notSelected')
        }}</span>
        <span
          v-if="deliveryTime || rating"
          class="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-600"
        >
          <span v-if="deliveryTime">~{{ t('branch.minutes', { minutes: deliveryTime }) }}</span>
          <span v-if="deliveryTime && rating">·</span>
          <template v-if="rating">
            <span>{{ rating.toFixed(1) }}</span>
            <i class="pi pi-star-fill text-amber-500 text-[10px]" aria-hidden="true" />
          </template>
        </span>
      </span>
      <span class="shrink-0 text-sm font-semibold text-primary">{{ t('branch.switch') }}</span>
    </span>
  </button>
</template>
