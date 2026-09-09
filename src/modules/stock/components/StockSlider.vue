<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import Carousel from 'primevue/carousel'
import type { Stock } from '../api/stock.service'
import { useStockStore } from '../stores/stock.store'
import StockModal from './StockModal.vue'

const stockStore = useStockStore()
const { stocks } = storeToRefs(stockStore)

const isCircular = computed(() => stocks.value.length > 5)

const responsiveOptions = ref([
  {
    breakpoint: '1536px',
    numVisible: 6,
    numScroll: 1,
  },
  {
    breakpoint: '1280px',
    numVisible: 5,
    numScroll: 1,
  },
  {
    breakpoint: '1024px',
    numVisible: 4,
    numScroll: 1,
  },
  {
    breakpoint: '768px',
    numVisible: 3,
    numScroll: 1,
  },
  {
    breakpoint: '480px',
    numVisible: 2,
    numScroll: 1,
  },
])
</script>

<template>
  <div v-if="stocks.length" class="w-full pb-4 bg-gray-200 max-w-7xl mx-auto px-4">
    <Carousel
      :value="stocks"
      :num-visible="5"
      :num-scroll="1"
      :responsive-options="responsiveOptions"
      :circular="isCircular"
      :autoplay-interval="5000"
      :show-navigators="false"
      :show-indicators="false"
      class="custom-carousel"
    >
      <template #item="{ data }: { data: Stock }">
        <div
          class="p-2 cursor-pointer transition-transform duration-200 h-full flex justify-center hover:scale-105"
          @click="stockStore.openProductModal(data)"
        >
          <div
            class="overflow-hidden rounded-2xl shadow-md bg-white w-full max-w-50 aspect-4/5 mx-auto"
          >
            <img
              :src="data.photo_url"
              :alt="data.text || 'Акция'"
              class="w-full h-full object-cover object-center block"
              loading="lazy"
            />
          </div>
        </div>
      </template>
    </Carousel>

    <StockModal />
  </div>
</template>
