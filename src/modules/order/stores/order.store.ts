// order.store.ts
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

    if (createdOrderId.value && numericStep !== 3) {
      return
    }

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
  }

  function clearCreatedOrder() {
    createdOrderId.value = null
    lastCreatedOrder.value = null
    activeStep.value = 1
    errorMessage.value = null
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

    const shouldSendAddress =
      form.fulfillment_type === 'delivery' && !form.call_operator_for_address

    let comment = form.comment?.trim() || null
    if (form.call_operator_for_address) {
      const note = 'Адрес назовет по телефону'
      comment = comment ? `${comment} (${note})` : note
    }

    const payload: CreateOrderPayload = {
      customer_name: form.customer_name || null,
      customer_phone: form.customer_phone.length === 12 ? form.customer_phone : null,
      fulfillment_type: form.fulfillment_type,
      payment_method: form.payment_method,
      comment,
      cook_by: form.cook_by || null,
      address: {
        street: shouldSendAddress ? form.address.street || null : null,
        house: shouldSendAddress ? form.address.house || null : null,
        apartment: shouldSendAddress ? form.address.apartment || null : null,
        entrance: shouldSendAddress ? form.address.entrance || null : null,
        floor: shouldSendAddress ? form.address.floor || null : null,
        intercom: shouldSendAddress ? form.address.intercom || null : null,
      },
      branch_id: branchId,
      cart_id: cartId,
    }

    try {
      const order = await OrderService.createOrder(payload)
      lastCreatedOrder.value = order
      createdOrderId.value = order.id
      activeStep.value = 3

      await cartStore.fetchCart(branchId, true)

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
    clearCreatedOrder,
    createOrder,
  }
})
