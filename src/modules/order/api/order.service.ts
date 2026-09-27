import { api } from '@/api/client'
import type { paths, components } from '@/api/types'

export type OrderResponse =
  paths['/client/orders']['post']['responses']['200']['content']['application/json']

export type Order = OrderResponse['data']

export type CreateOrderPayload = components['schemas']['CreateOrderRequest']

export const OrderService = {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await api.post<OrderResponse>('/client/orders', payload)
    return data.data
  },
}
