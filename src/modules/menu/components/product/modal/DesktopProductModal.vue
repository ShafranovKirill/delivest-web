<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
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
    class="w-[90vw] max-w-4xl rounded-3xl overflow-hidden shadow-2xl border-0"
  >
    <template #container>
      <div class="relative w-full bg-white p-6 sm:p-8">
        <Button
          @click="menuStore.closeProductModal()"
          severity="secondary"
          text
          rounded
          class="absolute! right-4 top-4 z-10 w-10 h-10 bg-gray-100! hover:bg-gray-200! text-gray-600! transition-colors"
          icon="pi pi-times"
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div class="flex justify-center items-center rounded-2xl p-6 aspect-square max-h-87.5">
            <img
              :src="getImageUrl(activeProduct?.photo_url)"
              @error="handleImageError"
              class="max-h-[35vh] object-contain rounded-3xl"
            />
          </div>

          <div class="flex flex-col justify-between h-full min-h-75">
            <div class="space-y-4">
              <div>
                <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  {{ activeProduct?.name }}
                </h2>

                <div class="flex items-center gap-3 text-sm text-gray-500 mt-2 font-medium">
                  <span v-if="activeProduct?.weight" class="bg-gray-100 px-2.5 py-1 rounded-md">
                    {{ activeProduct.weight }} г
                  </span>
                  <span v-if="activeProduct?.quantity" class="bg-gray-100 px-2.5 py-1 rounded-md">
                    {{ activeProduct.quantity }} шт.
                  </span>
                </div>
              </div>

              <p
                v-if="activeProduct?.description"
                class="text-gray-600 leading-relaxed text-sm sm:text-base"
              >
                {{ activeProduct.description }}
              </p>
            </div>

            <div class="mt-6 flex flex-col gap-4">
              <AddToCartButton :product="activeProduct" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </Dialog>
</template>
