import { useQuery } from '@tanstack/vue-query'
import { OrderService } from '../api/order.service'

export const ACTIVE_ORDERS_KEY = ['active-orders']

const POLL_INTERVAL = 30_000

export const useActiveOrdersQuery = () =>
  useQuery({
    queryKey: ACTIVE_ORDERS_KEY,
    queryFn: OrderService.getActiveOrders,
    staleTime: POLL_INTERVAL,
    refetchInterval: (query) => (query.state.data?.length ? POLL_INTERVAL : false),
    refetchOnWindowFocus: true,
  })
