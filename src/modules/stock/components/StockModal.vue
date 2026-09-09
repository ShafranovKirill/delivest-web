<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useStockStore } from '../stores/stock.store'

const stockStore = useStockStore()
const { isStockModalOpen, activeStock } = storeToRefs(stockStore)
</script>

<template>
  <Dialog
    v-model:visible="isStockModalOpen"
    modal
    dismissable-mask
    :draggable="false"
    class="w-full max-w-md mx-4 overflow-hidden rounded-2xl"
    @hide="stockStore.closeProductModal"
  >
    <template #header>
      <span class="text-xl font-bold">Акция</span>
    </template>

    <div v-if="activeStock" class="flex flex-col gap-4">
      <div class="w-full aspect-4/3 rounded-xl overflow-hidden bg-gray-100">
        <img
          :src="activeStock.photo_url"
          :alt="activeStock.text || 'Акция'"
          class="w-full h-full object-cover object-center"
        />
      </div>

      <p v-if="activeStock.text" class="text-gray-700 text-base leading-relaxed">
        {{ activeStock.text }}
      </p>
    </div>

    <template #footer>
      <div class="w-full pt-2">
        <Button
          label="Закрыть"
          severity="secondary"
          class="w-full"
          @click="stockStore.closeProductModal"
        />
      </div>
    </template>
  </Dialog>
</template>
