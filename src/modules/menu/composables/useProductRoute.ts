import { computed, onScopeDispose, watch } from 'vue'
import { isNavigationFailure, useRoute, useRouter } from 'vue-router'
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
  let pushedKey: string | null = null
  let pushedBranch: string | undefined
  let pendingPush: Promise<unknown> | null = null
  let closingPush = false
  let closeVersion = 0
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
      closingPush = false
      pushedByUs = false
      if (menuStore.isProductModalOpen) menuStore.closeProductModal()
      return
    }
    if (closingPush) return
    const product = menuStore.activeProduct
    if (shownBranch === branchId && menuStore.isProductModalOpen && product && [product.id, product.slug].includes(key)) return
    retry()
  }, { immediate: true })

  const stopModal = watch(() => [menuStore.isProductModalOpen, menuStore.activeProduct] as const,
    ([isOpen, product]) => {
      if (isOpen && product) {
        closingPush = false
        closeVersion++
        shownBranch = branch.activeBranch?.id
        const key = productKey(product)
        if (queryKey.value !== key && queryKey.value !== product.id) {
          pushedByUs = true
          pushedKey = key
          pushedBranch = branch.activeBranch?.id
          const push = router.push({ query: { ...route.query, [PRODUCT_QUERY_KEY]: key } })
          pendingPush = push
          void push.then(
            () => { if (pendingPush === push) pendingPush = null },
            () => { if (pendingPush === push) pendingPush = null },
          )
        }
        return
      }
      if (!isOpen) {
        loader.cancel()
        if (pushedByUs) {
          pushedByUs = false
          closingPush = true
          const version = ++closeVersion
          const key = pushedKey
          const branchId = pushedBranch
          const navigateBack = (result?: unknown) => {
            if (
              version === closeVersion && !menuStore.isProductModalOpen &&
              !isNavigationFailure(result) && queryKey.value === key &&
              branch.activeBranch?.id === branchId
            ) router.back()
            else closingPush = false
          }
          if (pendingPush) void pendingPush.then(navigateBack, () => { closingPush = false })
          else navigateBack()
        } else if (queryKey.value) {
          void router.replace({ name: 'menu', params: { slug: route.params.slug }, query: withoutProductQuery() })
        }
      }
    }, { flush: 'sync' })

  onScopeDispose(() => {
    loader.cancel()
    stopRoute()
    stopModal()
    menuStore.retryProduct = null
  })
}
