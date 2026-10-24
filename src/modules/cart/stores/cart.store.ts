import { defineStore } from 'pinia'
import { ref, computed, watch, type WatchStopHandle } from 'vue'
import {
  CartService,
  type AppliedPromotion,
  type Cart,
  type CartItem,
  type FulfillmentType,
  type PromoHint,
} from '../api/cart.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { getApiErrorCode } from '@/api/errors'

export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)

  const items = computed<CartItem[]>(() => cart.value?.items ?? [])
  const totalQuantity = computed<number>(() => cart.value?.total_quantity ?? 0)
  const totalAmount = computed<number>(() => cart.value?.total_amount ?? 0)
  const subtotalAmount = computed<number>(() => cart.value?.subtotal_amount ?? 0)
  const discountAmount = computed<number>(() => cart.value?.discount_amount ?? 0)
  const promotions = computed<AppliedPromotion[]>(() => cart.value?.promotions ?? [])
  const hints = computed<PromoHint[]>(() => cart.value?.hints ?? [])
  const promoCode = computed(() => cart.value?.promo_code ?? null)
  const isEmpty = computed<boolean>(() => items.value.length === 0)

  const branchStore = useBranchStore()

  async function fetchCart(branchId?: string, force: boolean = false): Promise<Cart> {
    isLoading.value = true
    try {
      const currentBranchId = branchId ?? branchStore.activeBranch?.id
      const data = await CartService.getCart(currentBranchId, force)
      cart.value = data
      isInitialized.value = true
      return data
    } catch (error: unknown) {
      console.error('[CartStore] Failed to fetch cart:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  let stopBranchSync: WatchStopHandle | null = null

  function initBranchSync() {
    if (stopBranchSync) return stopBranchSync

    stopBranchSync = watch(
      () => branchStore.activeBranch?.id,
      async (newBranchId, oldBranchId) => {
        if (newBranchId === oldBranchId) return

        if (newBranchId) {
          try {
            await fetchCart(newBranchId, true)
          } catch (error) {
            console.error('[CartStore] Failed to update cart after branch change:', error)
          }
        } else {
          cart.value = null
        }
      },
    )

    return stopBranchSync
  }

  async function withCart(mutate: (cartId: string) => Promise<Cart>): Promise<Cart> {
    if (!cart.value?.id) await fetchCart()

    isLoading.value = true
    try {
      try {
        cart.value = await mutate(cart.value!.id)
      } catch (error) {
        if (getApiErrorCode(error) !== 'cart_not_found') throw error

        const fresh = await fetchCart(undefined, true)
        isLoading.value = true
        cart.value = await mutate(fresh.id)
      }
      return cart.value!
    } finally {
      isLoading.value = false
    }
  }

  async function addItem(productId: string): Promise<Cart> {
    try {
      return await withCart((cartId) => CartService.addItem(cartId, productId))
    } catch (error) {
      console.error(`[CartStore] Failed to add product ${productId}:`, error)
      throw error
    }
  }

  async function removeItem(productId: string): Promise<Cart> {
    if (!cart.value?.id) return fetchCart()

    try {
      return await withCart((cartId) => CartService.removeItem(cartId, productId, false))
    } catch (error) {
      console.error(`[CartStore] Failed to remove product ${productId}:`, error)
      throw error
    }
  }

  async function removeAllOfItem(productId: string): Promise<Cart> {
    if (!cart.value?.id) return fetchCart()

    try {
      return await withCart((cartId) => CartService.removeItem(cartId, productId, true))
    } catch (error) {
      console.error(`[CartStore] Failed to remove all items for product ${productId}:`, error)
      throw error
    }
  }

  function getItemQuantity(productId: string): number {
    const item = items.value.find((i) => i.product_id === productId && !i.gift)
    return item?.quantity ?? 0
  }

  async function repeatOrder(orderId: string): Promise<Cart> {
    return withCart((cartId) => CartService.repeatOrder(cartId, orderId))
  }

  async function applyPromoCode(code: string): Promise<Cart> {
    return withCart((cartId) => CartService.applyPromoCode(cartId, code))
  }

  async function removePromoCode(): Promise<Cart> {
    return withCart((cartId) => CartService.removePromoCode(cartId))
  }

  async function setFulfillment(fulfillmentType: FulfillmentType): Promise<Cart | null> {
    if (cart.value?.fulfillment_type === fulfillmentType) return cart.value
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
    promotions,
    hints,
    promoCode,
    isEmpty,
    isLoading,
    isInitialized,

    fetchCart,
    initBranchSync,
    addItem,
    removeItem,
    removeAllOfItem,
    clearCart,
    getItemQuantity,
    repeatOrder,
    applyPromoCode,
    removePromoCode,
    setFulfillment,
  }
})
