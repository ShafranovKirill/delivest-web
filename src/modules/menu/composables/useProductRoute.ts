import { computed, onScopeDispose, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MenuService, type MenuProduct } from '../api/menu.service'
import { useMenuStore } from '../stores/menu.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { createProductLoader } from './productLoader'

export const PRODUCT_QUERY_KEY = 'product'
export function productKey(product: Pick<MenuProduct, 'id' | 'slug'>): string {
  return product.slug || product.id!
}

export function useProductRoute() {
  const route = useRoute()
  const router = useRouter()
  const menuStore = useMenuStore()
  const branch = useBranchStore()
  let pushedByUs = false
  let shownBranch: string | undefined
  const queryKey = computed(() => {
    const value = route.params.productKey ?? route.query[PRODUCT_QUERY_KEY]
    return typeof value === 'string' && value ? value : null
  })
  const loader = createProductLoader(MenuService.getProduct, product => {
    shownBranch = branch.activeBranch?.id
    menuStore.openProductModal(product)
  }, state => {
    menuStore.productLoadState = state
    if (state === 'loading') {
      menuStore.activeProduct = null
      menuStore.isProductModalOpen = true
    }
  })

  function withoutProductQuery() {
    const query = { ...route.query }
    delete query[PRODUCT_QUERY_KEY]
    return query
  }

  function retry() {
    const branchId = branch.activeBranch?.id
    if (branchId && queryKey.value) void loader.load(branchId, queryKey.value)
  }
  menuStore.retryProduct = retry

  const stopRoute = watch([queryKey, () => branch.activeBranch?.id], ([key, branchId]) => {
    loader.cancel()
    if (!key || !branchId) {
      pushedByUs = false
      if (menuStore.isProductModalOpen) menuStore.closeProductModal()
      return
    }
    const product = menuStore.activeProduct
    if (shownBranch === branchId && menuStore.isProductModalOpen && product && [product.id, product.slug].includes(key)) return
    retry()
  }, { immediate: true })

  const stopModal = watch(() => [menuStore.isProductModalOpen, menuStore.activeProduct] as const,
    ([isOpen, product]) => {
      if (isOpen && product) {
        shownBranch = branch.activeBranch?.id
        const key = productKey(product)
        if (queryKey.value !== key && queryKey.value !== product.id) {
          pushedByUs = true
          void router.push({ query: { ...route.query, [PRODUCT_QUERY_KEY]: key } })
        }
        return
      }
      if (!isOpen) {
        loader.cancel()
        if (!queryKey.value) return
        if (pushedByUs) { pushedByUs = false; router.back() }
        else void router.replace({ name: 'menu', params: { slug: route.params.slug }, query: withoutProductQuery() })
      }
    }, { flush: 'sync' })

  onScopeDispose(() => {
    loader.cancel()
    stopRoute()
    stopModal()
    menuStore.retryProduct = null
  })
}
