// order.store.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
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
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { emptyDeliveryAddress, toAddressPayload } from '@/modules/fulfillment/utils/deliveryAddress'

const PRICE_ERRORS = [
  'price_changed',
  'cart_changed',
  'promo_unavailable',
  'promo_gift_not_available',
]

export const useOrderStore = defineStore('order', () => {
  const branchStore = useBranchStore()
  const cartStore = useCartStore()
  const authStore = useAuthStore()

  const isLoading = ref(false)
  const lastCreatedOrder = ref<Order | null>(null)

  const activeStep = ref<number>(1)
  const createdOrderId = ref<string | number | null>(null)
  const errorMessage = ref<string | null>(null)
  let loadVersion = 0
  let submitVersion = 0
  const context = () => `${branchStore.activeBranch?.id ?? ''}:${authStore.sessionEpoch}`
  watch(context, () => resetOrderState(), { flush: 'sync' })

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
    loadVersion++
    submitVersion++
    isLoading.value = false
    activeStep.value = 1
    createdOrderId.value = null
    lastCreatedOrder.value = null
    errorMessage.value = null
  }

  function clearCreatedOrder() {
    loadVersion++
    submitVersion++
    isLoading.value = false
    createdOrderId.value = null
    lastCreatedOrder.value = null
    activeStep.value = 1
    errorMessage.value = null
  }

  async function loadOrder(id: string) {
    const cached = String(createdOrderId.value) === id && lastCreatedOrder.value
    const hadPendingRequest = isLoading.value
    const version = ++loadVersion
    const requestedContext = context()
    submitVersion++
    if (cached && !hadPendingRequest) return
    isLoading.value = true
    errorMessage.value = null
    try {
      const order = await OrderService.getOrder(id)
      if (version !== loadVersion || requestedContext !== context()) return
      lastCreatedOrder.value = order
      createdOrderId.value = order.id
      activeStep.value = 3
    } catch {
      if (version !== loadVersion || requestedContext !== context()) return
      createdOrderId.value = null
      lastCreatedOrder.value = null
      activeStep.value = 1
      errorMessage.value = t('order.success.loadFailed')
    } finally {
      if (version === loadVersion && requestedContext === context()) isLoading.value = false
    }
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
    const version = ++submitVersion
    const requestedContext = context()

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
      spend_points: form.spend_points > 0 ? form.spend_points : null,
      comment,
      cook_by: form.cook_by || null,
      address: toAddressPayload(
        shouldSendAddress && form.address ? form.address : emptyDeliveryAddress(),
      ),
      branch_id: branchId,
      cart_id: cartId,
      cart_revision: cartStore.cart?.revision ?? undefined,
      expected_total: cartStore.totalAmount,
    }

    try {
      const order = await OrderService.createOrder(payload, cartId)
      if (version !== submitVersion || requestedContext !== context()) {
        if (requestedContext === context() && branchStore.activeBranch?.id === branchId) {
          void cartStore.fetchCart(branchId, true).catch(console.error)
        }
        queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_KEY })
        queryClient.invalidateQueries({ queryKey: MY_ORDERS_KEY })
        return
      }
      lastCreatedOrder.value = order
      createdOrderId.value = order.id
      activeStep.value = 3

      void cartStore.fetchCart(branchId, true).catch((error) => {
        console.error('[OrderStore] Failed to refresh cart after order creation:', error)
      })
      queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_KEY })
      queryClient.invalidateQueries({ queryKey: MY_ORDERS_KEY })
      queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY })

      return order
    } catch (error: unknown) {
      if (version !== submitVersion || requestedContext !== context()) return
      const errorCode = getApiErrorCode(error)
      errorMessage.value = getApiErrorMessage(error, t('order.failed'))
      if (errorCode === 'client_auth_required' || errorCode === 'unauthorized') {
        authStore.openModal()
      }
      if (errorCode === 'idempotency_conflict' || errorCode === 'payment_unavailable') {
        queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_KEY })
        queryClient.invalidateQueries({ queryKey: MY_ORDERS_KEY })
      }
      if (errorCode === 'fulfillment_unavailable') {
        await branchStore.refreshBranches().catch(() => null)
      }
      if (PRICE_ERRORS.includes(errorCode ?? '')) {
        await cartStore.fetchCart(branchId, true).catch(() => null)
      }
      throw error
    } finally {
      if (version === submitVersion && requestedContext === context()) isLoading.value = false
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
    loadOrder,
    createOrder,
  }
})
