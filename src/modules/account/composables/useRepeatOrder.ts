import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { getApiErrorMessage } from '@/api/errors'
import type { ActiveOrder } from '@/modules/order/api/order.service'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useOpenCart } from '@/modules/cart/composables/useOpenCart'

export function useRepeatOrder() {
  const { t } = useI18n()
  const toast = useToast()
  const cartStore = useCartStore()
  const openCart = useOpenCart()
  const repeatingId = ref<string | null>(null)

  function missingCount(order: ActiveOrder) {
    const inCart = new Set(cartStore.items.map((item) => item.product_id))
    return order.items.filter((item) => !item.gift && !inCart.has(item.product_id)).length
  }

  function warn(detail: string) {
    toast.add({ severity: 'warn', summary: t('account.orders.repeatOrder'), detail, life: 4000 })
  }

  async function repeat(order: ActiveOrder) {
    if (repeatingId.value) return
    repeatingId.value = order.id
    try {
      await cartStore.repeatOrder(order.id)
      const missing = missingCount(order)
      if (cartStore.isEmpty) return warn(t('account.orders.repeatEmpty'))
      if (missing) warn(t('account.orders.repeatPartial'))
      openCart()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: t('cart.title'),
        detail: getApiErrorMessage(error),
        life: 3000,
      })
    } finally {
      repeatingId.value = null
    }
  }

  return { repeat, repeatingId }
}
