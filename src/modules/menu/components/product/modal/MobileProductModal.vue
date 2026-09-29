<script setup lang="ts">
import { useImagePlaceholder } from '@/modules/menu/composables/useImagePlaceholder'
import { useMenuStore } from '@/modules/menu/stores/menu.store.ts'
import { storeToRefs } from 'pinia'
import Drawer from 'primevue/drawer'
import AddToCartButton from '../button/AddToCartButton.vue'

const { getImageUrl, handleImageError } = useImagePlaceholder()
const menuStore = useMenuStore()
const { activeProduct } = storeToRefs(menuStore)
</script>

<template>
  <Drawer v-model:visible="menuStore.isProductModalOpen" position="bottom" class="h-dvh!">
    <template #container>
      <button
        @click="menuStore.closeProductModal()"
        class="absolute top-5 left-5 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-200"
      >
        <i class="pi pi-angle-down text-3xl! font-extralight!" />
      </button>

      <div class="flex flex-col p-4 pt-16 h-full overflow-y-auto">
        <div class="w-full flex justify-center items-center shrink-0">
          <img
            :src="getImageUrl(activeProduct?.photo_url)"
            @error="handleImageError"
            class="w-full max-w-70 sm:max-w-xs aspect-square object-cover rounded-4xl"
          />
        </div>

        <div class="flex flex-col justify-between grow mt-4">
          <div class="flex flex-col gap-3">
            <h2 class="text-3xl font-normal! text-gray-900 tracking-tight">
              {{ activeProduct?.name }}
            </h2>

            <div
              v-if="activeProduct?.weight || activeProduct?.quantity"
              class="flex items-center gap-3 text-sm text-gray-500 font-medium"
            >
              <span v-if="activeProduct?.weight" class="bg-gray-100 px-2.5 py-1 rounded-md">
                {{ activeProduct.weight }} г
              </span>
              <span v-if="activeProduct?.quantity" class="bg-gray-100 px-2.5 py-1 rounded-md">
                {{ activeProduct.quantity }} шт.
              </span>
            </div>

            <p
              v-if="activeProduct?.description"
              class="text-gray-600 leading-relaxed text-sm sm:text-base pb-4"
            >
              {{ activeProduct.description }}
            </p>
          </div>

          <!-- Прижимаем кнопку заказа к низу, если контента мало, или оставляем после описания -->
          <div class="pt-4 mt-auto sticky bottom-0 bg-white/80 backdrop-blur-md pb-4">
            <AddToCartButton :product="activeProduct" @added="menuStore.closeProductModal()" />
          </div>
        </div>
      </div>
    </template>
  </Drawer>
</template>
