<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useStockStore } from '../stores/stock.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import StockModal from '../components/StockModal.vue'

const stockStore = useStockStore()
const branchStore = useBranchStore()

const { stocks } = storeToRefs(stockStore)
const { activeBranch } = storeToRefs(branchStore)

watch(
  () => activeBranch.value?.id,
  (newBranchId) => {
    if (newBranchId) {
      stockStore.fetchStocks(newBranchId)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="bg-gray-200 w-full min-h-screen">
    <div class="bg-white rounded-4xl w-full min-h-screen py-8 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Акции и спецпредложения
          </h1>
          <p class="text-sm text-gray-500 mt-1">Нажмите на акцию, чтобы узнать подробности</p>
        </div>

        <div
          v-if="stocks.length"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6"
        >
          <div
            v-for="stock in stocks"
            :key="stock.id"
            class="group relative cursor-pointer flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
            @click="stockStore.openProductModal(stock)"
          >
            <div class="aspect-4/5 w-full overflow-hidden bg-gray-100 relative">
              <img
                :src="stock.photo_url"
                :alt="stock.text || 'Акция'"
                class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div
                class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              ></div>
            </div>

            <div v-if="stock.text" class="p-3 flex items-center justify-between gap-2">
              <span
                class="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-snug"
              >
                {{ stock.text }}
              </span>
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <i class="pi pi-percentage text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-500 font-medium">В данном заведении сейчас нет активных акций</p>
        </div>
      </div>
    </div>

    <StockModal />
  </div>
</template>
