import { defineStore } from 'pinia'

import { OrderService, type Order, type CreateOrderPayload } from '../api/order.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { ref } from 'vue'

export const useOrderStore = defineStore('order', () => {
  const branchStore = useBranchStore()
  const cartStore = useCartStore()

  const isLoading = ref(false)
  const lastCreatedOrder = ref<Order | null>(null)

  async function createOrder(
    orderData: Omit<CreateOrderPayload, 'branch_id' | 'cart_id'>,
  ): Promise<Order> {
    const branchId = branchStore.activeBranch?.id || branchStore.getBranchIdFromCookie()
    const cartId = cartStore.cart?.id

    if (!branchId) {
      throw new Error('[OrderStore] Не выбран филиал (branch_id отсутствует)')
    }

    if (!cartId) {
      throw new Error('[OrderStore] Корзина пуста или не инициализирована (cart_id отсутствует)')
    }

    isLoading.value = true

    const payload: CreateOrderPayload = {
      ...orderData,
      branch_id: branchId,
      cart_id: cartId,
    }

    try {
      const order = await OrderService.createOrder(payload)
      lastCreatedOrder.value = order

      return order
    } catch (error) {
      console.error('[OrderStore] Ошибка при создании заказа:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    lastCreatedOrder,
    createOrder,
  }
})
