import { useQuery } from '@tanstack/vue-query'
import { OrderService } from '../api/order.service'

export const ACTIVE_ORDERS_KEY = ['active-orders']

export const useActiveOrdersQuery = () =>
  useQuery({
    queryKey: ACTIVE_ORDERS_KEY,
    queryFn: OrderService.getActiveOrders,
    staleTime: Infinity,
  })
