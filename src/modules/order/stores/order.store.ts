// order.store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { OrderService, type Order, type CreateOrderPayload } from '../api/order.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { getApiErrorCode, getApiErrorMessage } from '@/api/errors'
import { queryClient } from '@/api/client'
import type { OrderFormValues } from '../components/OrderForm.vue'
import { ACTIVE_ORDERS_KEY } from '../composables/useActiveOrdersQuery'
import { MY_ORDERS_KEY } from '@/modules/account/composables/useMyOrdersQuery'
import { ADDRESSES_KEY } from '@/modules/account/composables/useAddressesQuery'
import { t } from '@/i18n'
import { emptyDeliveryAddress, toAddressPayload } from '@/modules/fulfillment/utils/deliveryAddress'

const PRICE_ERRORS = ['price_changed', 'promo_unavailable']

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
    if (isLoading.value || createdOrderId.value) return

    errorMessage.value = null

    if (cartStore.isEmpty) {
      errorMessage.value = t('errors.codes.cart_is_empty')
      activeStep.value = 1
      return
    }

    const branchId = branchStore.activeBranch?.id || branchStore.getBranchIdFromCookie()
    const cartId = cartStore.cart?.id

    if (!branchId) {
      throw new Error('[OrderStore] branch_id is missing')
    }

    if (!cartId) {
      throw new Error('[OrderStore] cart_id is missing')
    }

    isLoading.value = true

    const shouldSendAddress =
      form.fulfillment_type === 'delivery' && !form.call_operator_for_address && form.address

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
      cash_given: form.cash_given,
      comment,
      cook_by: form.cook_by || null,
      address: toAddressPayload(
        shouldSendAddress && form.address ? form.address : emptyDeliveryAddress(),
      ),
      branch_id: branchId,
      cart_id: cartId,
      expected_total: cartStore.totalAmount,
    }

    try {
      const order = await OrderService.createOrder(payload)
      lastCreatedOrder.value = order
      createdOrderId.value = order.id
      activeStep.value = 3

      await cartStore.fetchCart(branchId, true)
      queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_KEY })
      queryClient.invalidateQueries({ queryKey: MY_ORDERS_KEY })
      queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY })

      const paymentUrl = order.payment?.confirmation_url
      if (paymentUrl) window.location.assign(paymentUrl)

      return order
    } catch (error: unknown) {
      errorMessage.value = getApiErrorMessage(error, t('order.failed'))
      if (PRICE_ERRORS.includes(getApiErrorCode(error) ?? '')) {
        await cartStore.fetchCart(branchId, true).catch(() => null)
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
