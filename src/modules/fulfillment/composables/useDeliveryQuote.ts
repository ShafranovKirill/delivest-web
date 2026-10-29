import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { formatPrice } from '@/utils/money'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useFulfillmentStore } from '../stores/fulfillment.store'
import { DeliveryService } from '../api/delivery.service'
import type { DeliveryAddress } from '../utils/deliveryAddress'

export const useDeliveryQuote = (address?: MaybeRefOrGetter<DeliveryAddress | null>) => {
  const { t } = useI18n()
  const branchStore = useBranchStore()
  const cartStore = useCartStore()
  const fulfillmentStore = useFulfillmentStore()

  const target = computed(() =>
    address === undefined ? fulfillmentStore.deliveryAddress : toValue(address),
  )

  const branchId = computed(() => branchStore.activeBranch?.id ?? null)

  const query = useQuery({
    queryKey: computed(() => [
      'delivery-quote',
      branchId.value,
      target.value?.latitude ?? null,
      target.value?.longitude ?? null,
      cartStore.totalAmount,
    ]),
    queryFn: () =>
      DeliveryService.quote(
        branchId.value!,
        target.value?.latitude ?? null,
        target.value?.longitude ?? null,
        cartStore.totalAmount,
      ),
    enabled: computed(() => Boolean(branchId.value && target.value)),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })

  const quote = computed(() => (target.value ? (query.data.value ?? null) : null))

  const price = computed(() => (quote.value?.status === 'ok' ? (quote.value.price ?? 0) : null))

  const blocked = computed(() => Boolean(quote.value && quote.value.status !== 'ok'))

  const notDelivered = computed(() =>
    ['outside_zones', 'no_coordinates'].includes(quote.value?.status ?? ''),
  )

  const hint = computed(() => {
    const value = quote.value
    if (!value) return null

    switch (value.status) {
      case 'ok':
        if (!value.price) return t('delivery.free')
        return value.free_from
          ? t('delivery.priceFreeFrom', {
              price: formatPrice(value.price),
              sum: formatPrice(value.free_from),
            })
          : t('delivery.price', { price: formatPrice(value.price) })
      case 'below_minimum':
        return t('delivery.minimum', { sum: formatPrice(value.min_order) })
      case 'outside_zones':
        return t('delivery.outside')
      default:
        return t('delivery.noPoint')
    }
  })

  return { quote, price, blocked, notDelivered, hint, isFetching: query.isFetching }
}
