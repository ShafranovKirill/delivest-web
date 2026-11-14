import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { Order } from '../api/order.service'
import { OrderService } from '../api/order.service'

export function useOrderSuccessQuery(initialOrder: Ref<Order | null>) {
  const auth = useAuthStore()
  const branch = useBranchStore()
  const orderId = computed(() => initialOrder.value?.id ?? null)

  return useQuery({
    queryKey: computed(() => [
      'order-success',
      auth.client?.id ?? 'guest',
      auth.sessionEpoch,
      branch.activeBranch?.id ?? null,
      orderId.value,
    ]),
    enabled: computed(
      () => !!orderId.value && initialOrder.value?.branch_id === branch.activeBranch?.id,
    ),
    queryFn: ({ signal, queryKey }) => OrderService.getOrder(queryKey[4] as string, signal),
    initialData: () =>
      initialOrder.value?.branch_id === branch.activeBranch?.id
        ? (initialOrder.value ?? undefined)
        : undefined,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'completed' || status === 'cancelled' ? false : 5_000
    },
  })
}
