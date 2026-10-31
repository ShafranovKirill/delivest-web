import { api } from '@/api/client'
import type { paths, components } from '@/api/types'

export type OrderResponse =
  paths['/client/orders']['post']['responses']['200']['content']['application/json']

export type Order = OrderResponse['data']

export type CreateOrderPayload = components['schemas']['CreateOrderRequest']

type ActiveOrdersResponse =
  paths['/client/orders/active']['get']['responses']['200']['content']['application/json']

export type ActiveOrder = components['schemas']['ActiveOrder']

export type OrderStatus = ActiveOrder['status']

export const OrderService = {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await api.post<OrderResponse>('/client/orders', payload)
    return data.data
  },

  async cancelOrder(id: string): Promise<Order> {
    const { data } = await api.post<OrderResponse>(`/client/orders/${id}/cancel`)
    return data.data
  },

  async getPaymentLink(id: string): Promise<string> {
    const { data } = await api.post<{ data: { confirmation_url: string } }>(
      `/client/orders/${id}/pay`,
    )
    return data.data.confirmation_url
  },

  async getActiveOrders(): Promise<ActiveOrder[]> {
    const { data } = await api.get<ActiveOrdersResponse>('/client/orders/active')
    return data.data
  },
}
