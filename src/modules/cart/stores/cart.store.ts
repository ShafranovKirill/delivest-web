import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { CartService, type Cart, type CartItem } from '../api/cart.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'

export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)

  const items = computed<CartItem[]>(() => cart.value?.items ?? [])
  const totalQuantity = computed<number>(() => cart.value?.total_quantity ?? 0)
  const totalAmount = computed<number>(() => cart.value?.total_amount ?? 0)
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

  function initBranchSync() {
    return watch(
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
  }

  async function addItem(productId: string): Promise<Cart> {
    if (!cart.value?.id) {
      await fetchCart()
    }

    const currentCartId = cart.value!.id
    isLoading.value = true

    try {
      const updatedCart = await CartService.addItem(currentCartId, productId)
      cart.value = updatedCart
      return updatedCart
    } catch (error) {
      console.error(`[CartStore] Failed to add product ${productId}:`, error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function removeItem(productId: string): Promise<Cart> {
    if (!cart.value?.id) return fetchCart()

    isLoading.value = true
    try {
      const updatedCart = await CartService.removeItem(cart.value.id, productId, false)
      cart.value = updatedCart
      return updatedCart
    } catch (error) {
      console.error(`[CartStore] Failed to remove product ${productId}:`, error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function removeAllOfItem(productId: string): Promise<Cart> {
    if (!cart.value?.id) return fetchCart()

    isLoading.value = true
    try {
      const updatedCart = await CartService.removeItem(cart.value.id, productId, true)
      cart.value = updatedCart
      return updatedCart
    } catch (error) {
      console.error(`[CartStore] Failed to remove all items for product ${productId}:`, error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function getItemQuantity(productId: string): number {
    const item = items.value.find((i) => i.product_id === productId)
    return item?.quantity ?? 0
  }

  async function clearCart(): Promise<void> {
    if (!cart.value?.id) return

    isLoading.value = true
    try {
      const updatedCart = await CartService.clearCart(cart.value.id)
      cart.value = updatedCart
    } catch (error) {
      console.error('[CartStore] Failed to clear cart:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    cart,
    items,
    totalQuantity,
    totalAmount,
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
  }
})
