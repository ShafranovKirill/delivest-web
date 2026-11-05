import { nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useOpenCart } from './useOpenCart'

export function useReturnToCart() {
  const route = useRoute()
  const router = useRouter()
  const branchStore = useBranchStore()
  const openCart = useOpenCart()

  return async () => {
    const slug =
      typeof route.params.slug === 'string' ? route.params.slug : branchStore.activeBranch?.slug
    if (!slug) return

    try {
      const failure = await router.push({ name: 'menu', params: { slug } })
      if (failure) return
    } catch {
      return
    }

    await nextTick()
    if (router.currentRoute.value.name === 'menu' && router.currentRoute.value.params.slug === slug) {
      openCart()
    }
  }
}
