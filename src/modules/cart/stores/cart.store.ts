import { defineStore } from 'pinia'
import { ref, computed, watch, type WatchStopHandle } from 'vue'
import {
  CartService,
  type AppliedPromotion,
  type Cart,
  type CartItem,
  type FulfillmentType,
  type ModifierChoice,
  type PromoHint,
} from '../api/cart.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { getApiErrorCode } from '@/api/errors'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const revision = ref(0)

  const items = computed<CartItem[]>(() => cart.value?.items ?? [])
  const totalQuantity = computed<number>(() => cart.value?.total_quantity ?? 0)
  const totalAmount = computed<number>(() => cart.value?.total_amount ?? 0)
  const subtotalAmount = computed<number>(() => cart.value?.subtotal_amount ?? 0)
  const baseStars = computed(() => cart.value?.base_stars ?? 0)
  const productStars = computed(() => cart.value?.product_stars ?? 0)
  const discountAmount = computed<number>(() => cart.value?.discount_amount ?? 0)
  const promotions = computed<AppliedPromotion[]>(() => cart.value?.promotions ?? [])
  const hints = computed<PromoHint[]>(() => cart.value?.hints ?? [])
  const promoCode = computed(() => cart.value?.promo_code ?? null)
  const isEmpty = computed<boolean>(() => items.value.length === 0)
  const hasStopped = computed<boolean>(() => items.value.some((item) => item.stopped && !item.gift))

  const branchStore = useBranchStore()
  const authStore = useAuthStore()
  let requestVersion = 0
  let mutationVersion = 0
  let fetchController: AbortController | null = null
  let mutationQueue: Promise<unknown> = Promise.resolve()
  let mutationActiveContext: string | null = null
  let contextGeneration = 0
  const context = () => `${branchStore.activeBranch?.id ?? ''}:${authStore.sessionEpoch}`

  watch(
    context,
    () => {
      contextGeneration++
      requestVersion++
      mutationVersion++
      revision.value++
      fetchController?.abort()
      mutationQueue = Promise.resolve()
      mutationActiveContext = null
      cart.value = null
      isInitialized.value = false
      isLoading.value = false
    },
    { flush: 'sync' },
  )

  async function fetchCart(branchId?: string, force: boolean = false): Promise<Cart> {
    const requestedContext = context()
    const requestedGeneration = contextGeneration
    const requestedBranch = branchId ?? branchStore.activeBranch?.id
    const version = ++requestVersion
    const mutationAtStart = mutationVersion
    fetchController?.abort()
    const controller = new AbortController()
    fetchController = controller
    isLoading.value = true
    try {
      const data = await CartService.getCart(requestedBranch, force, controller.signal)
      if (
        version === requestVersion &&
        requestedGeneration === contextGeneration &&
        requestedContext === context() &&
        requestedBranch === branchStore.activeBranch?.id &&
        mutationAtStart === mutationVersion &&
        mutationActiveContext !== requestedContext
      ) {
        cart.value = data
        revision.value++
        isInitialized.value = true
      }
      return data
    } catch (error: unknown) {
      if (!controller.signal.aborted) console.error('[CartStore] Failed to fetch cart:', error)
      throw error
    } finally {
      if (version === requestVersion) {
        if (mutationActiveContext !== requestedContext) isLoading.value = false
        fetchController = null
      }
    }
  }

  let stopBranchSync: WatchStopHandle | null = null

  function initBranchSync() {
    if (stopBranchSync) return stopBranchSync

    stopBranchSync = watch(context, async () => {
      const newBranchId = branchStore.activeBranch?.id
      if (newBranchId) {
        try {
          await fetchCart(newBranchId, true)
        } catch (error) {
          console.error('[CartStore] Failed to update cart after branch change:', error)
        }
      }
    })

    return stopBranchSync
  }

  function withCart(mutate: (cartId: string) => Promise<Cart>): Promise<Cart> {
    const queuedContext = context()
    const queuedGeneration = contextGeneration
    const isCurrent = () => queuedGeneration === contextGeneration && queuedContext === context()
    const run = async () => {
      if (!isCurrent()) throw new Error('Cart context changed')
      isLoading.value = true
      try {
        if (!cart.value?.id) await fetchCart()
        if (!isCurrent()) throw new Error('Cart context changed')
        const cartId = cart.value?.id
        if (!cartId) throw new Error('Cart is unavailable')
        mutationActiveContext = queuedContext
        let data: Cart
        try {
          data = await mutate(cartId)
        } catch (error) {
          if (getApiErrorCode(error) !== 'cart_not_found') throw error
          const fresh = await fetchCart(undefined, true)
          if (!isCurrent()) throw new Error('Cart context changed')
          data = await mutate(fresh.id)
        }
        if (isCurrent()) {
          mutationVersion++
          revision.value++
          requestVersion++
          fetchController?.abort()
          cart.value = data
        }
        return data
      } finally {
        if (isCurrent() && mutationActiveContext === queuedContext) mutationActiveContext = null
        if (isCurrent()) isLoading.value = false
      }
    }
    const result = mutationQueue.then(run)
    mutationQueue = result.catch(() => undefined)
    return result
  }

  async function addStarItem(productId: string): Promise<Cart> {
    return withCart((cartId) => CartService.addStarItem(cartId, productId))
  }

  async function addItem(productId: string, modifiers?: ModifierChoice[]): Promise<Cart> {
    try {
      return await withCart((cartId) => CartService.addItem(cartId, productId, modifiers))
    } catch (error) {
      console.error(`[CartStore] Failed to add product ${productId}:`, error)
      throw error
    }
  }

  async function replaceItem(key: string, modifiers: ModifierChoice[]): Promise<Cart> {
    try {
      return await withCart((cartId) => CartService.replaceItem(cartId, key, modifiers))
    } catch (error) {
      console.error(`[CartStore] Failed to replace item ${key}:`, error)
      throw error
    }
  }

  async function removeItem(key: string): Promise<Cart> {
    if (!cart.value?.id) return fetchCart()

    try {
      return await withCart((cartId) => CartService.removeItem(cartId, key, false))
    } catch (error) {
      console.error(`[CartStore] Failed to remove item ${key}:`, error)
      throw error
    }
  }

  async function removeAllOfItem(key: string): Promise<Cart> {
    if (!cart.value?.id) return fetchCart()

    try {
      return await withCart((cartId) => CartService.removeItem(cartId, key, true))
    } catch (error) {
      console.error(`[CartStore] Failed to remove all items ${key}:`, error)
      throw error
    }
  }

  function getItemQuantity(productId: string): number {
    return items.value
      .filter((i) => i.product_id === productId && !i.gift)
      .reduce((sum, i) => sum + i.quantity, 0)
  }

  async function repeatOrder(orderId: string): Promise<Cart> {
    return withCart((cartId) => CartService.repeatOrder(cartId, orderId))
  }

  async function choosePromoGifts(promotionId: string, productIds: string[]): Promise<Cart> {
    return withCart((cartId) => CartService.choosePromoGifts(cartId, promotionId, productIds))
  }

  async function applyPromoCode(code: string): Promise<Cart> {
    return withCart((cartId) => CartService.applyPromoCode(cartId, code))
  }

  async function removePromoCode(): Promise<Cart> {
    return withCart((cartId) => CartService.removePromoCode(cartId))
  }

  async function setFulfillment(fulfillmentType: FulfillmentType): Promise<Cart | null> {
    return withCart((cartId) => CartService.setFulfillment(cartId, fulfillmentType))
  }

  async function clearCart(): Promise<void> {
    if (!cart.value?.id) return

    try {
      await withCart((cartId) => CartService.clearCart(cartId))
    } catch (error) {
      console.error('[CartStore] Failed to clear cart:', error)
      throw error
    }
  }

  return {
    cart,
    items,
    totalQuantity,
    totalAmount,
    subtotalAmount,
    discountAmount,
    baseStars,
    productStars,
    promotions,
    hints,
    promoCode,
    isEmpty,
    hasStopped,
    isLoading,
    isInitialized,
    revision,

    fetchCart,
    initBranchSync,
    addStarItem,
    addItem,
    replaceItem,
    removeItem,
    removeAllOfItem,
    clearCart,
    getItemQuantity,
    repeatOrder,
    choosePromoGifts,
    applyPromoCode,
    removePromoCode,
    setFulfillment,
  }
})
