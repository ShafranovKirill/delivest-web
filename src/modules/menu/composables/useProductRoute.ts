import { computed, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuCategory, MenuProduct } from '../api/menu.service'
import { useMenuStore } from '../stores/menu.store'

export const PRODUCT_QUERY_KEY = 'product'

export function productKey(product: Pick<MenuProduct, 'id' | 'slug'>): string {
  return product.slug || product.id!
}

export function useProductRoute(menu: Ref<MenuCategory[] | undefined>) {
  const route = useRoute()
  const router = useRouter()
  const menuStore = useMenuStore()

  let pushedByUs = false

  const productsByKey = computed(() => {
    const map = new Map<string, MenuProduct>()
    for (const category of menu.value ?? []) {
      for (const product of category.products ?? []) {
        if (product.slug) map.set(product.slug, product)
        if (product.id) map.set(product.id, product)
      }
    }
    return map
  })

  const queryKey = computed(() => {
    const value = route.query[PRODUCT_QUERY_KEY]
    return typeof value === 'string' && value ? value : null
  })

  function withoutProductQuery() {
    const query = { ...route.query }
    delete query[PRODUCT_QUERY_KEY]
    return query
  }

  watch(
    [queryKey, productsByKey],
    ([key, products]) => {
      if (!key) {
        pushedByUs = false
        if (menuStore.isProductModalOpen) menuStore.closeProductModal()
        return
      }
      if (products.size === 0) return

      const product = products.get(key)
      if (!product) {
        router.replace({ query: withoutProductQuery() })
        return
      }
      if (menuStore.activeProduct?.id !== product.id || !menuStore.isProductModalOpen) {
        menuStore.openProductModal(product)
      }
    },
    { immediate: true },
  )

  watch(
    () => [menuStore.isProductModalOpen, menuStore.activeProduct] as const,
    ([isOpen, product]) => {
      if (isOpen && product) {
        const key = productKey(product)
        if (queryKey.value !== key && queryKey.value !== product.id) {
          pushedByUs = true
          router.push({ query: { ...route.query, [PRODUCT_QUERY_KEY]: key } })
        }
        return
      }

      if (!isOpen && queryKey.value) {
        if (pushedByUs) {
          pushedByUs = false
          router.back()
        } else {
          router.replace({ query: withoutProductQuery() })
        }
      }
    },
  )
}
