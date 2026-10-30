<script setup lang="ts">
import { computed } from 'vue'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const branchStore = useBranchStore()
const rating = computed(() => useFranchiseStore().rating)

const deliveryTime = computed(() => {
  return branchStore.activeBranch?.branch_info?.delivery_time
})
</script>

<template>
  <div class="flex flex-col text-sm border-gray-300 pl-4">
    <div class="flex items-center gap-1.5 font-medium leading-tight">
      <span class="text-gray-600">{{ t('branch.foodDelivery') }}</span>

      <button
        type="button"
        @click="branchStore.openModal()"
        class="text-(--p-primary-500) font-bold hover:text-(--p-primary-800) focus:outline-none cursor-pointer flex items-center gap-1 transition-colors"
      >
        <span>{{ branchStore.activeBranch?.name || t('branch.select.title') }}</span>
      </button>
    </div>

    <div class="flex items-center gap-2 text-sm font-medium leading-tight text-gray-600 mt-0.5">
      <template v-if="deliveryTime">
        <span>{{ t('branch.minutes', { minutes: deliveryTime }) }}</span>
        <span v-if="rating">•</span>
      </template>

      <div v-if="rating" class="flex items-center gap-0.5 font-semibold text-gray-600">
        <span>{{ rating.value.toFixed(1) }}</span>
        <i class="pi pi-star-fill text-amber-400 text-[10px]"></i>
      </div>
    </div>
  </div>
</template>
