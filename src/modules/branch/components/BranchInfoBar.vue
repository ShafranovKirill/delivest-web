<script setup lang="ts">
import { computed } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'

const branchStore = useBranchStore()

const deliveryTime = computed(() => {
  return branchStore.activeBranch?.branch_info?.delivery_time
})
</script>

<template>
  <div class="flex flex-col text-sm border-gray-300 pl-4">
    <div class="flex items-center gap-1.5 font-medium leading-tight">
      <span class="text-gray-600">Доставка еды</span>
      <span class="text-(--p-primary-500) font-bold">
        {{ branchStore.activeBranch?.name }}
      </span>
    </div>

    <div class="flex items-center gap-2 text-sm font-medium leading-tight text-gray-600 mt-0.5">
      <template v-if="deliveryTime">
        <span>{{ deliveryTime }} мин</span>
        <span>•</span>
      </template>

      <div class="flex items-center gap-0.5 font-semibold text-gray-600">
        <span>4.78</span>
        <i class="pi pi-star-fill text-amber-400 text-[10px]"></i>
      </div>
    </div>
  </div>
</template>
