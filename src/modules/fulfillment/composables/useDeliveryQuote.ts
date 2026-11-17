import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { formatPrice } from '@/utils/money'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useFulfillmentStore } from '../stores/fulfillment.store'
import { DeliveryService } from '../api/delivery.service'
import type { DeliveryAddress } from '../utils/deliveryAddress'
import { isComplete, lngLatOf } from '../utils/deliveryAddress'

export const useDeliveryQuote = (
  address?: MaybeRefOrGetter<DeliveryAddress | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) => {
  const { t } = useI18n()
  const branchStore = useBranchStore()
  const cartStore = useCartStore()
  const fulfillmentStore = useFulfillmentStore()

  const target = computed(() =>
    address === undefined ? fulfillmentStore.deliveryAddress : toValue(address),
  )

  const branchId = computed(() => branchStore.activeBranch?.id ?? null)
  const ready = computed(() =>
    Boolean(
      target.value &&
      isComplete(target.value, branchStore.mapAddress === false) &&
      (!branchStore.requiresCoordinates || lngLatOf(target.value)),
    ),
  )

  const query = useQuery({
    queryKey: computed(() => [
      'delivery-quote',
      branchId.value,
      branchStore.requiresCoordinates,
      branchStore.requiresCoordinates ? (target.value?.latitude ?? null) : null,
      branchStore.requiresCoordinates ? (target.value?.longitude ?? null) : null,
      cartStore.totalAmount,
      cartStore.revision,
    ]),
    queryFn: () =>
      DeliveryService.quote(
        branchId.value!,
        branchStore.requiresCoordinates ? (target.value?.latitude ?? null) : null,
        branchStore.requiresCoordinates ? (target.value?.longitude ?? null) : null,
        cartStore.totalAmount,
      ),
    enabled: computed(() => Boolean(toValue(enabled) && branchId.value && ready.value)),
    staleTime: 60 * 1000,
  })

  const pending = computed(() =>
    Boolean(ready.value && (query.isPending.value || query.isFetching.value)),
  )
  const quote = computed(() =>
    ready.value && !pending.value && !query.isError.value ? (query.data.value ?? null) : null,
  )

  const price = computed(() => (quote.value?.status === 'ok' ? (quote.value.price ?? 0) : null))

  const blocked = computed(() =>
    Boolean(target.value && (pending.value || !quote.value || quote.value.status !== 'ok')),
  )

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

  return {
    quote,
    price,
    blocked,
    pending,
    notDelivered,
    hint,
    isError: query.isError,
    isFetching: query.isFetching,
    retry: query.refetch,
    subtotal: computed(() => cartStore.totalAmount),
    ready,
  }
}
