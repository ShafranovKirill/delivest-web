import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

import { OrderService, type Order, type CreateOrderPayload } from '../api/order.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import type { OrderFormValues } from '../components/OrderForm.vue'

export const useOrderStore = defineStore('order', () => {
  const branchStore = useBranchStore()
  const cartStore = useCartStore()

  const isLoading = ref(false)
  const lastCreatedOrder = ref<Order | null>(null)

  const activeStep = ref<number>(1)
  const createdOrderId = ref<string | number | null>(null)
  const errorMessage = ref<string | null>(null)

  function handleStepChange(step: string | number) {
    const numericStep = Number(step)
    if (Number(activeStep.value) === 3 && numericStep !== 3) {
      return
    }
    activeStep.value = numericStep
  }

  function resetOrderState() {
    activeStep.value = 1
    createdOrderId.value = null
    lastCreatedOrder.value = null
    errorMessage.value = null
    cartStore.clearCart?.()
  }

  async function createOrder(form: OrderFormValues): Promise<Order | void> {
    errorMessage.value = null

    if (cartStore.isEmpty) {
      errorMessage.value = 'Ваша корзина пуста'
      activeStep.value = 1
      return
    }

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
      customer_name: form.customer_name || null,
      customer_phone: form.customer_phone.length === 12 ? form.customer_phone : null,
      fulfillment_type: form.fulfillment_type,
      payment_method: form.payment_method,
      comment: form.comment || null,
      address:
        form.fulfillment_type === 'delivery'
          ? {
              city: form.address.city || null,
              street: form.address.street || null,
              house: form.address.house || null,
              apartment: form.address.apartment || null,
              entrance: form.address.entrance || null,
              floor: form.address.floor || null,
              intercom: form.address.intercom || null,
            }
          : undefined,
      branch_id: branchId,
      cart_id: cartId,
    }

    try {
      const order = await OrderService.createOrder(payload)
      lastCreatedOrder.value = order
      createdOrderId.value = order.id
      activeStep.value = 3

      await cartStore.fetchCart(true)

      return order
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        errorMessage.value = error.response?.data?.error || 'Произошла ошибка при оформлении заказа'
      } else if (error instanceof Error) {
        errorMessage.value = error.message
      } else {
        errorMessage.value = 'Произошла ошибка при оформлении заказа'
      }
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    lastCreatedOrder,
    activeStep,
    createdOrderId,
    errorMessage,
    handleStepChange,
    resetOrderState,
    createOrder,
  }
})
