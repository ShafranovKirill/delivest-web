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
    class="flex flex-col text-xs cursor-pointer select-none py-1 min-w-0 w-fit items-start mx-auto"
    @click="branchStore.openModal()"
  >
    <!-- Верхняя строка: Название филиала (обрезается, если длиннее низа) -->
    <div class="flex items-center gap-1 font-medium leading-tight mb-0.5 min-w-0 w-full">
      <span class="text-(--p-primary-500) font-bold truncate min-w-0 w-full text-center">
        {{ branchStore.activeBranch?.name || 'Выберите филиал' }}
      </span>
    </div>

    <div
      class="flex items-center justify-start gap-1.5 text-[11px] text-gray-700 font-medium leading-tight min-w-0 w-full"
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
