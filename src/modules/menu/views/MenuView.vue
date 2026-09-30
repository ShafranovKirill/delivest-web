<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMenuQuery } from '../composables/useMenuQuery'

import CartButtonMobile from '@/modules/cart/components/CartButtonMobile.vue'
import { useViewportStore } from '@/modules/shared/stores/viewport.store.ts'
import StockSlider from '@/modules/stock/components/StockSlider.vue'
import { useCartStore } from '@/modules/cart/stores/cart.store.ts'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import MobileCategoryBar from '../components/category/MobileCategoryBar.vue'
import DesktopCategoryBar from '../components/category/DesktopCategoryBar.vue'
import SkeletonCategory from '../components/category/SkeletonCategory.vue'
import CategoryComponent from '../components/category/CategoryComponent.vue'
import ProductModal from '../components/product/modal/ProductModal.vue'

const viewportStore = useViewportStore()
const cartStore = useCartStore()
const branchStore = useBranchStore()

const { data: menuData, isLoading, isError, refetch } = useMenuQuery()

const menu = computed(() => {
  return menuData.value?.filter((category) => category.products && category.products.length > 0)
})

onMounted(() => {
  cartStore.initBranchSync()

  if (!cartStore.isInitialized) {
    cartStore.fetchCart(branchStore.activeBranch?.id)
  }
})
</script>

<template>
  <div class="bg-gray-200">
    <StockSlider />
  </div>
  <MobileCategoryBar v-if="viewportStore.isMobile" />
  <DesktopCategoryBar v-if="!viewportStore.isMobile" />
  <div v-if="isLoading" class="px-2 sm:px-4 max-w-7xl mx-auto">
    <SkeletonCategory v-for="i in 4" :key="i"></SkeletonCategory>
  </div>
  <div v-else-if="isError" class="px-2 sm:px-4 max-w-7xl mx-auto">
    <ErrorComponent :onRetry="refetch"></ErrorComponent>
  </div>
  <div v-else class="px-2 sm:px-4 max-w-7xl mx-auto">
    <CategoryComponent v-for="category in menu" :key="category.id" :category="category" />
  </div>
  <ProductModal />
  <CartButtonMobile v-if="viewportStore.isMobile" />
</template>
