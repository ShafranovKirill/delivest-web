<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import Carousel from 'primevue/carousel'
import type { Stock } from '../api/stock.service'
import { useStockStore } from '../stores/stock.store'

const stockStore = useStockStore()
const { stocks } = storeToRefs(stockStore)

const responsiveOptions = ref([
  {
    breakpoint: '1400px',
    numVisible: 4,
    numScroll: 1,
  },
  {
    breakpoint: '1024px',
    numVisible: 4,
    numScroll: 1,
  },
  {
    breakpoint: '640px',
    numVisible: 2,
    numScroll: 1,
  },
])
</script>

<template>
  <div v-if="stocks.length" class="w-full pb-4 bg-gray-200 max-w-7xl mx-auto">
    <Carousel
      :value="stocks"
      :num-visible="4"
      :num-scroll="1"
      :responsive-options="responsiveOptions"
      :circular="true"
      :autoplay-interval="5000"
      :show-navigators="false"
      :show-indicators="false"
    >
      <template #item="{ data }: { data: Stock }">
        <div
          class="p-2 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
          @click="stockStore.openProductModal(data)"
        >
          <div class="overflow-hidden rounded-2xl shadow-md bg-white">
            <img
              :src="data.photo_url"
              :alt="data.text || 'Акция'"
              class="w-full object-cover object-center block h-50"
              loading="lazy"
            />
          </div>
        </div>
      </template>
    </Carousel>
  </div>
</template>
