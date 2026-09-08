<script setup lang="ts">
import { computed } from 'vue'
import { useMenuQuery } from '../composables/useMenuQuery'
import MobileCategoryBar from './category/MobileCategoryBar.vue'
import DesktopCategoryBar from './category/DesktopCategoryBar.vue'
import CategoryComponent from './category/CategoryComponent.vue'
import SkeletonCategory from './category/SkeletonCategory.vue'
import ErrorComponent from './category/ErrorComponent.vue'
import ProductModal from './product/modal/ProductModal.vue'
import CartButtonMobile from '@/modules/cart/components/CartButtonMobile.vue'
import { useViewportStore } from '@/modules/shared/stores/viewport.store.ts'
import StockSlider from '@/modules/stock/components/StockSlider.vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store.ts'
import { useStockStore } from '@/modules/stock/stores/stock.store.ts'

const viewportStore = useViewportStore()
const branchStore = useBranchStore()
const stockStore = useStockStore()

const { data: menuData, isLoading, isError, refetch } = useMenuQuery()

const menu = computed(() => {
  return menuData.value?.filter((category) => category.products && category.products.length > 0)
})

if (branchStore.activeBranch?.id) {
  stockStore.fetchStocks(branchStore.activeBranch.id)
}
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
