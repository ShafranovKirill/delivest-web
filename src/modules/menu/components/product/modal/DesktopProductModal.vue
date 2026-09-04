<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useImagePlaceholder } from '../../../composables/useImagePlaceholder'
import AddToCartButton from './AddToCartButton.vue'
import { useMenuStore } from '@/modules/menu/stores/menu.store.ts'

const menuStore = useMenuStore()
const { activeProduct } = storeToRefs(menuStore)
const { getImageUrl, handleImageError } = useImagePlaceholder()
</script>
<template>
  <Dialog
    v-model:visible="menuStore.isProductModalOpen"
    :dismissable-mask="true"
    modal
    class="w-[85vw] max-w-5xl h-[50vh] rounded-4xl!"
  >
    <template #container>
      <Button
        @click="menuStore.closeProductModal()"
        severity="secondary"
        rounded
        class="absolute! -right-13 top-3 bg-white! hover:bg-gray-200!"
        icon="pi pi-times"
      ></Button>
      <div class="grid grid-cols-[6fr_4fr] gap-x-3 h-full w-full p-4">
        <div class="w-full flex justify-center items-center overflow-hidden">
          <img
            :src="getImageUrl(activeProduct?.photo_url)"
            @error="handleImageError"
            class="max-h-[30vh] object-contain rounded-4xl"
          />
        </div>
        <div class="w-full flex flex-col justify-between h-full">
          <div class="flex flex-col">
            <h2 class="text-2xl">{{ activeProduct?.name }}</h2>
            <p v-if="activeProduct?.weight">{{ activeProduct?.weight }} г.</p>
            <p v-if="activeProduct?.description" class="text-black mt-2">
              {{ activeProduct?.description }}
            </p>
          </div>
          <AddToCartButton :price="activeProduct?.price!" />
        </div>
      </div>
    </template>
  </Dialog>
</template>
