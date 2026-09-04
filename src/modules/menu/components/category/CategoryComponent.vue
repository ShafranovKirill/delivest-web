<script setup lang="ts">
import type { MenuCategory } from '../../api/menu.service.ts'
import { vIntersectionObserver } from '@vueuse/components'
import ProductCard from '../product/ProductCard.vue'
import { useMenuStore } from '../../stores/menu.store.ts'

const props = defineProps<{ category: MenuCategory }>()
const menuStore = useMenuStore()

function onIntersectionObserver(entries: IntersectionObserverEntry[]) {
  if (entries[0]?.isIntersecting && !menuStore.isManualScroll) {
    menuStore.setActiveCategory(props.category.id)
  }
}
</script>
<template>
  <div
    :id="`category-${category.id}`"
    v-intersection-observer="[onIntersectionObserver, { rootMargin: '-20% 0px -60% 0px' }]"
    class="my-4 scroll-mt-20"
  >
    <h2 class="mb-2 ml-2 text-3xl font-bold! text-900">{{ category.name }}</h2>
    <div
      class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-1 sm:gap-2 justify-items-center"
    >
      <ProductCard
        v-for="product in category.products"
        :key="product.id"
        :product="product"
      ></ProductCard>
    </div>
  </div>
</template>
