<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useEventListener } from '@vueuse/core'
import { useMenuStore } from '../stores/menu.store'
import { useMenuQuery } from '../composables/useMenuQuery'
import { useProductRoute } from '../composables/useProductRoute'

import CartButtonMobile from '@/modules/cart/components/CartButtonMobile.vue'
import { useViewportStore } from '@/modules/shared/stores/viewport.store.ts'
import StoryStrip from '@/modules/stock/components/StoryStrip.vue'
import ClosedBanner from '@/modules/branch/components/ClosedBanner.vue'
import PausedBanner from '@/modules/branch/components/PausedBanner.vue'
import StoryViewer from '@/modules/stock/components/StoryViewer.vue'
import FulfillmentSummary from '@/modules/fulfillment/components/FulfillmentSummary.vue'
import { useFulfillmentStore } from '@/modules/fulfillment/stores/fulfillment.store'
import ActiveOrders from '@/modules/order/components/active/ActiveOrders.vue'
import { useCartStore } from '@/modules/cart/stores/cart.store.ts'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import MobileCategoryBar from '../components/category/MobileCategoryBar.vue'
import DesktopCategoryBar from '../components/category/DesktopCategoryBar.vue'
import SkeletonCategory from '../components/category/SkeletonCategory.vue'
import CategoryComponent from '../components/category/CategoryComponent.vue'
import ProductModal from '../components/product/modal/ProductModal.vue'
import ErrorComponent from '../components/category/ErrorComponent.vue'

const viewportStore = useViewportStore()
const cartStore = useCartStore()
const branchStore = useBranchStore()
const fulfillmentStore = useFulfillmentStore()

const { data: menuData, isLoading, isError, refetch } = useMenuQuery()

const menu = computed(() => {
  return menuData.value?.filter((category) => category.products && category.products.length > 0)
})

const menuStore = useMenuStore()

useEventListener(window, 'scroll', () => {
  const first = menu.value?.[0]
  if (!first || menuStore.isManualScroll) return
  const top = document.getElementById(`category-${first.id}`)?.getBoundingClientRect().top
  if (top !== undefined && top > window.innerHeight * 0.2) menuStore.setActiveCategory(first.id)
})

useProductRoute(menuData)

onMounted(() => {
  cartStore.initBranchSync()

  if (!cartStore.isInitialized) {
    cartStore.fetchCart(branchStore.activeBranch?.id)
  }
})
</script>

<template>
  <div class="bg-gray-200">
    <PausedBanner />
    <ClosedBanner />
    <StoryStrip />
    <div v-if="fulfillmentStore.current" class="w-full max-w-7xl mx-auto px-4 pb-4">
      <FulfillmentSummary />
    </div>
    <ActiveOrders />
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
  <StoryViewer />
  <CartButtonMobile v-if="viewportStore.isMobile" />
</template>
