<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, onScopeDispose, provide, watch } from 'vue'
import { useRoute } from 'vue-router'
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
import { useFunnelAnalytics } from '@/modules/analytics/useFunnelAnalytics'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import NotificationCards from '@/modules/notifications/components/NotificationCards.vue'
import { useCartStore } from '@/modules/cart/stores/cart.store.ts'
import { useOpenCart } from '@/modules/cart/composables/useOpenCart'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { pendingPrivateSession } from '@/api/storefront'
import MobileCategoryBar from '../components/category/MobileCategoryBar.vue'
import DesktopCategoryBar from '../components/category/DesktopCategoryBar.vue'
import SkeletonCategory from '../components/category/SkeletonCategory.vue'
import CategoryComponent from '../components/category/CategoryComponent.vue'
import ErrorComponent from '../components/category/ErrorComponent.vue'
import { useLoyaltyModalStore } from '@/modules/account/stores/loyalty.store'
import { useI18n } from 'vue-i18n'
import { menuDisplayState } from '../utils/menuDisplayState'
import ProductModalPending from '../components/product/modal/ProductModalPending.vue'
import { ProductPhotoQueue, productPhotoQueueKey } from '../utils/productPhotoQueue'

const ProductModal = defineAsyncComponent({
  loader: () => import('../components/product/modal/ProductModal.vue'),
  loadingComponent: ProductModalPending,
  errorComponent: ProductModalPending,
  delay: 0,
  onError(_error, retry, fail, attempts) {
    if (attempts < 2) retry()
    else fail()
  },
})
const LoyaltyModal = defineAsyncComponent(
  () => import('@/modules/account/components/LoyaltyModal.vue'),
)
const loyaltyModal = useLoyaltyModalStore()
const { t, locale } = useI18n()

const viewportStore = useViewportStore()
const cartStore = useCartStore()
const openCart = useOpenCart()
const branchStore = useBranchStore()
const authStore = useAuthStore()
const analytics = useFunnelAnalytics()
const route = useRoute()
const fulfillmentStore = useFulfillmentStore()

const { data: menuData, isLoading, isError, refetch } = useMenuQuery()
const menuStore = useMenuStore()
const photoQueue = new ProductPhotoQueue()
provide(productPhotoQueueKey, photoQueue)
onScopeDispose(() => photoQueue.dispose())
watch([() => branchStore.activeBranch?.id, locale], () => photoQueue.reset(), { flush: 'sync' })
watch(
  [menuData, isLoading, () => branchStore.activeBranch?.id, locale],
  ([data, loading]) => { if (data && !loading) photoQueue.resume() },
  { flush: 'post', immediate: true },
)
useEventListener(window, 'scroll', () => photoQueue.viewportChanged(), { passive: true })
useEventListener(window, 'resize', () => photoQueue.viewportChanged())
watch(
  () => menuStore.isProductModalOpen,
  async (open, wasOpen) => {
    if (!wasOpen || open) return
    menuStore.editingKey = null
    if (menuStore.returnToCart) {
      menuStore.returnToCart = false
      await nextTick()
      openCart()
    }
  },
)

const menu = computed(() => {
  return menuData.value?.filter((category) => category.products && category.products.length > 0)
})
const displayState = computed(() =>
  menuDisplayState(
    Boolean(menuData.value),
    isLoading.value,
    isError.value,
    menu.value?.length ?? 0,
  ),
)

let viewedScope: string | null = null
watch(
  [
    menu,
    () => branchStore.activeBranch?.id,
    () => branchStore.activeBranch?.branch_info?.analytics_funnel_enabled,
    () => authStore.client?.id,
    () => authStore.sessionEpoch,
  ],
  ([categories, branchId, , clientId, epoch]) => {
    if (!branchId) {
      viewedScope = null
      return
    }
    const scope = `${clientId ?? 'guest'}:${epoch}:${branchId}`
    if (categories?.length && branchId && viewedScope !== scope) {
      analytics.track('menu_view')
      viewedScope = scope
    }
  },
  { immediate: true },
)
watch(
  () => [menuStore.isProductModalOpen, menuStore.activeProduct?.id] as const,
  ([open, id]) => {
    if (open && id) {
      analytics.track('product_view')
      if (menuStore.activeProduct) analytics.product(menuStore.activeProduct)
    } else analytics.closeProduct()
  },
)

let categoryNavigation = 0
let scrolledCategory: string | null = null
watch(
  [() => route.params.categoryId, () => branchStore.activeBranch?.id, menu],
  async ([key, , categories]) => {
    const version = ++categoryNavigation
    if (typeof key !== 'string') {
      scrolledCategory = null
      return
    }
    if (!categories?.some((category) => category.id === key)) return
    await nextTick()
    if (version !== categoryNavigation) return
    const navigation = `${branchStore.activeBranch?.id}:${key}`
    if (scrolledCategory === navigation) return
    scrolledCategory = navigation
    await menuStore.scrollToCategory(key)
  },
  { immediate: true, flush: 'post' },
)

watch(
  menu,
  (categories) => {
    const first = categories?.[0]
    if (first && !categories.some((category) => category.id === menuStore.activeCategoryId)) {
      menuStore.setActiveCategory(first.id)
    }
  },
  { immediate: true },
)

useEventListener(window, 'scroll', () => {
  const first = menu.value?.[0]
  if (!first || menuStore.isManualScroll) return
  const top = document.getElementById(`category-${first.id}`)?.getBoundingClientRect().top
  if (top !== undefined && top > window.innerHeight * 0.2) menuStore.setActiveCategory(first.id)
})

useProductRoute()

onMounted(() => {
  cartStore.initBranchSync()

  if (
    !cartStore.isInitialized &&
    !pendingPrivateSession(branchStore.activeBranch?.id ?? '', authStore.sessionEpoch)
  ) {
    cartStore.fetchCart(branchStore.activeBranch?.id).catch(console.error)
  }
})
</script>

<template>
  <div class="bg-gray-200">
    <PausedBanner />
    <ClosedBanner />
    <StoryStrip v-if="branchStore.activeBranch?.branch_info?.stocks_enabled" />
    <div v-if="fulfillmentStore.current" class="w-full max-w-7xl mx-auto px-4 pb-4">
      <FulfillmentSummary />
    </div>
    <ActiveOrders />
    <NotificationCards />
  </div>
  <MobileCategoryBar v-if="viewportStore.isMobile" />
  <DesktopCategoryBar v-if="!viewportStore.isMobile" />
  <div v-if="displayState === 'loading'" class="px-2 sm:px-4 max-w-7xl mx-auto">
    <SkeletonCategory v-for="i in 4" :key="i"></SkeletonCategory>
  </div>
  <div v-else-if="displayState === 'error'" class="px-2 sm:px-4 max-w-7xl mx-auto">
    <ErrorComponent :onRetry="refetch"></ErrorComponent>
  </div>
  <div v-else class="px-2 sm:px-4 max-w-7xl mx-auto">
    <p v-if="displayState === 'empty'" class="py-12 text-center text-gray-600">
      {{ t('menu.empty') }}
    </p>
    <CategoryComponent v-for="category in menu" :key="category.id" :category="category" />
  </div>
  <LoyaltyModal v-if="loyaltyModal.isOpen" />
  <ProductModal v-if="menuStore.isProductModalOpen" />
  <StoryViewer v-if="branchStore.activeBranch?.branch_info?.stocks_enabled" />
  <CartButtonMobile v-if="viewportStore.isMobile" />
</template>
