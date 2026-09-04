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

const { data: menuData, isLoading, isError, refetch } = useMenuQuery()

const menu = computed(() => {
  return menuData.value?.filter((category) => category.products && category.products.length > 0)
})
</script>
<template>
  <MobileCategoryBar class="md:hidden" />
  <DesktopCategoryBar class="hidden md:block" />
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
  <CartButtonMobile class="md:hidden!" />
</template>
