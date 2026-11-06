<script setup lang="ts">
import StarRewardBadge from '@/modules/account/components/StarRewardBadge.vue'

import type { MenuProduct } from '../../api/menu.service'
import ProductImage from './ProductImage.vue'
import { useMenuStore } from '../../stores/menu.store'
import AddToCartSwitch from './button/AddToCartSwitch.vue'
import ProductTagBadges from './tags/ProductTagBadges.vue'

const props = defineProps<{ product: MenuProduct }>()
const menuStore = useMenuStore()
function openProduct(event: MouseEvent | KeyboardEvent) {
  if (
    event instanceof MouseEvent &&
    (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
  )
    return
  if (
    event.target !== event.currentTarget &&
    (event.target as HTMLElement).closest('button, a, input, select, textarea')
  )
    return
  if (event instanceof KeyboardEvent) {
    if (
      event.target !== event.currentTarget ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    )
      return
    event.preventDefault()
  }
  menuStore.openProductModal(props.product)
}
</script>

<template>
  <Card
    role="button"
    tabindex="0"
    :aria-label="product.name"
    @click="openProduct"
    @keydown.enter="openProduct"
    @keydown.space="openProduct"
    class="group w-full h-full flex flex-col shrink-0 grow-0 rounded-4xl! p-2 overflow-hidden hover:cursor-pointer shadow-none! focus-visible:outline-2 focus-visible:outline-primary"
  >
    <template #content>
      <div class="flex flex-col h-full items-center justify-between">
        <div class="relative flex flex-col items-center w-full">
          <div class="absolute left-2 top-2 z-10 flex items-start gap-1">
            <ProductTagBadges :tags="product.tags ?? []" />
            <StarRewardBadge :amount="product.stars_reward" compact />
          </div>
          <ProductImage
            :src="product.photo_url"
            :alt="product.name"
            class="w-full mb-2 aspect-square rounded-4xl transition-transform duration-500 ease-in-out group-hover:translate-y-1.5"
            :class="{ 'opacity-50 grayscale': product.stopped }"
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
