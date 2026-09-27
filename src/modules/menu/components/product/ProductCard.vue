<script setup lang="ts">
import type { MenuProduct } from '../../api/menu.service'
import { useImagePlaceholder } from '../../composables/useImagePlaceholder'
import { useMenuStore } from '../../stores/menu.store'
import AddToCartSwitch from './button/AddToCartSwitch.vue'

const props = defineProps<{ product: MenuProduct }>()
const menuStore = useMenuStore()
const { getImageUrl, handleImageError } = useImagePlaceholder()
</script>

<template>
  <Card
    @click="menuStore.openProductModal(props.product)"
    class="group w-full h-full flex flex-col shrink-0 grow-0 rounded-4xl! p-2 overflow-hidden hover:cursor-pointer shadow-none!"
  >
    <template #content>
      <div class="flex flex-col h-full items-center justify-between">
        <div class="flex flex-col items-center w-full">
          <img
            :src="getImageUrl(product.photo_url)"
            @error="handleImageError"
            class="w-full mb-2 object-cover aspect-square rounded-4xl block transition-transform duration-500 ease-in-out group-hover:translate-y-1.5"
          />
          <p class="text-xl font-bold text-center mb-2">{{ product.name }}</p>
        </div>

        <AddToCartSwitch :product="product" />
      </div>
    </template>
  </Card>
</template>

<style scoped>
:deep(.p-card-body),
:deep(.p-card-content) {
  padding: 0 !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
