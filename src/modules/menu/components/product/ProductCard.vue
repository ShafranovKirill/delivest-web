<script setup lang="ts">
import type { MenuProduct } from '../../api/menu.service'
import { useImagePlaceholder } from '../../composables/useImagePlaceholder'
import { useMenuStore } from '../../stores/menu.store'

const props = defineProps<{ product: MenuProduct }>()
const menuStore = useMenuStore()
const { getImageUrl, handleImageError } = useImagePlaceholder()
</script>
<template>
  <Card
    @click="menuStore.openProductModal(props.product)"
    class="group w-full h-full shrink-0 grow-0 rounded-4xl! p-2 overflow-hidden hover:cursor-pointer shadow-none!"
  >
    <template #content>
      <img
        :src="getImageUrl(product.photo_url)"
        @error="handleImageError"
        class="w-full mb-2 object-cover aspect-square rounded-4xl block transition-transform duration-500 ease-in-out group-hover:scale-107"
      />
      <div class="flex flex-col items-center gap-2">
        <p class="text-xl font-bold text-center">{{ product.name }}</p>
        <Button class="rounded-4xl! bg-primary py-1.5! px-4! flex items-center gap-2">
          <span class="text-lg font-bold text-white"> {{ product.price }} ₽ </span>

          <span
            v-if="product.old_price && product.old_price !== '0.00'"
            class="text-sm text-white/70 line-through decoration-white/50"
          >
            {{ product.old_price }} ₽
          </span>
        </Button>
      </div>
    </template>
  </Card>
</template>

<style scoped>
:deep(.p-card-body) {
  padding: 0 !important;
}
</style>
