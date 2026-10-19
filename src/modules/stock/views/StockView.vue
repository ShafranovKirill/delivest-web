<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useStockStore } from '../stores/stock.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import StockModal from '../components/StockModal.vue'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'

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
  <PageShell title="Акции" subtitle="Нажмите на акцию, чтобы узнать подробности" width="wide">
    <div
      v-if="stocks.length"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
    >
      <button
        v-for="stock in stocks"
        :key="stock.id"
        type="button"
        class="group flex flex-col overflow-hidden rounded-3xl bg-gray-50 border border-gray-100 text-left cursor-pointer hover:border-primary transition-colors"
        @click="stockStore.openProductModal(stock)"
      >
        <span class="block aspect-4/5 w-full overflow-hidden bg-gray-100">
          <img
            :src="stock.photo_url"
            :alt="stock.text || 'Акция'"
            class="size-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </span>
        <span
          v-if="stock.text"
          class="px-3 py-3 text-sm font-semibold text-gray-800 line-clamp-2 leading-snug"
        >
          {{ stock.text }}
        </span>
      </button>
    </div>

    <EmptyState
      v-else
      icon="pi-percentage"
      title="Сейчас акций нет"
      text="Загляните позже — новые предложения появляются регулярно"
    />

    <StockModal />
  </PageShell>
</template>
