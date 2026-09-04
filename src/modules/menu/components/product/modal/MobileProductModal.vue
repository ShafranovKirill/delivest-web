<script setup lang="ts">
import AddToCartButton from './AddToCartButton.vue'
import { useImagePlaceholder } from '@/modules/menu/composables/useImagePlaceholder'
import { useMenuStore } from '@/modules/menu/stores/menu.store.ts'
import { storeToRefs } from 'pinia'
const { getImageUrl, handleImageError } = useImagePlaceholder()
const menuStore = useMenuStore()
const { activeProduct } = storeToRefs(menuStore)
</script>
<template>
  <Drawer position="bottom" class="h-screen!">
    <template #closebutton>
      <button
        @click="menuStore.closeProductModal"
        class="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-200"
      >
        <i class="pi pi-angle-down text-3xl! font-extralight!" />
      </button>
    </template>
    <template #container>
      <button
        @click="menuStore.closeProductModal"
        class="absolute top-5 left-5 flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-200"
      >
        <i class="pi pi-angle-down text-3xl! font-extralight!" />
      </button>
      <div class="flex flex-col p-4 pt-10 h-full">
        <div class="w-full flex justify-center items-center">
          <img
            :src="getImageUrl(activeProduct?.media_id)"
            @error="handleImageError"
            class="w-full aspect-square object-cover rounded-4xl"
          />
        </div>
        <div class="h-full justify-between flex flex-col">
          <div class="flex flex-col mt-4 gap-2">
            <h2 class="text-3xl font-normal!">{{ activeProduct?.name }}</h2>

            <p v-if="activeProduct?.description" class="text-black text-md leading-tight">
              {{ activeProduct?.description }}
            </p>
          </div>
          <div><AddToCartButton :price="menuStore.activeProduct?.price!" /></div>
        </div>
      </div>
    </template>
    <template #footer>
      <AddToCartButton :price="menuStore.activeProduct?.price!" />
    </template>
  </Drawer>
</template>
