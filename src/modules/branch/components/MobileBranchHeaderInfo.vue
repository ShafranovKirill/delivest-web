<script setup lang="ts">
import { computed } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'

const branchStore = useBranchStore()

const deliveryTime = computed(() => {
  return branchStore.activeBranch?.branch_info?.delivery_time
})
</script>

<template>
  <div
    class="flex flex-col text-xs cursor-pointer select-none py-1 min-w-0 w-full"
    @click="branchStore.openModal()"
  >
    <div class="flex items-center gap-1.5 text-[11px] font-medium leading-tight mb-0.5">
      <span
        class="w-2 h-2 rounded-full shrink-0"
        :class="branchStore.isOpenNow ? 'bg-emerald-500' : 'bg-red-500'"
      ></span>
      <span
        :class="
          branchStore.isOpenNow
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400'
        "
      >
        {{ branchStore.isOpenNow ? 'Открыто' : 'Закрыто' }}
      </span>
    </div>

    <div
      class="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium leading-tight min-w-0"
    >
      <template v-if="deliveryTime">
        <span class="shrink-0">~{{ deliveryTime }} мин</span>
        <span class="shrink-0">•</span>
      </template>

      <div
        class="flex items-center gap-0.5 text-gray-700! dark:text-gray-300 font-semibold shrink-0"
      >
        <span>4.78</span>
        <i class="pi pi-star-fill text-amber-400 text-[9px]"></i>
      </div>
    </div>
  </div>
</template>
