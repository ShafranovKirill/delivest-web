<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useSidebarStore } from '@/modules/widgets/sidebar/sidebar.store'

const branchStore = useBranchStore()
const sidebarStore = useSidebarStore()
const showInfo = ref(false)

const deliveryTime = computed(() => {
  return branchStore.activeBranch?.branch_info?.delivery_time
})

const openBranchModal = () => {
  sidebarStore.isSidebarVisible = false
  branchStore.openModal()
}

const toggleInfo = () => {
  showInfo.value = !showInfo.value
}
</script>

<template>
  <div class="flex flex-col text-sm w-full">
    <div class="flex flex-col items-start pb-2 cursor-pointer group" @click="openBranchModal">
      <div class="flex items-center gap-1.5">
        <i
          class="pi pi-map-marker text-xl! text-gray-700 group-hover:text-(--p-primary-500) transition-colors"
        ></i>
        <span
          class="text-xl font-bold text-gray-900 leading-tight group-hover:text-(--p-primary-500) transition-colors"
        >
          {{ branchStore.activeBranch?.name || 'Не выбран' }}
        </span>
      </div>

      <span
        class="pl-6.5 text-(--p-primary-500) font-semibold text-xs group-hover:text-(--p-primary-800) transition-colors mt-1"
      >
        Изменить
      </span>
    </div>

    <div class="border-b border-gray-100 my-1"></div>

    <div class="flex items-center justify-between pt-1">
      <div class="flex items-center gap-2 font-medium text-gray-600">
        <template v-if="deliveryTime">
          <span>~{{ deliveryTime }} мин</span>
          <span>•</span>
        </template>

        <div class="flex items-center gap-1 font-semibold text-gray-700">
          <span>4.78</span>
          <i class="pi pi-star-fill text-amber-400 text-[11px]"></i>
        </div>
      </div>

      <button
        type="button"
        @click="toggleInfo"
        class="text-gray-400 hover:text-gray-600 focus:outline-none p-1 transition-colors"
        aria-label="Информация о заведении"
      >
        <i class="pi pi-info-circle text-base"></i>
      </button>
    </div>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="showInfo"
        class="mt-2 p-2.5 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200/60 leading-relaxed"
      >
        Среднее время доставки — {{ deliveryTime ? `${deliveryTime} минут` : 'уточняется' }}.
        Рейтинг заведения сформирован на основе отзывов наших гостей.
      </div>
    </transition>
  </div>
</template>
