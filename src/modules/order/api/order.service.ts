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
  async createOrder(payload: CreateOrderPayload, idempotencyKey: string): Promise<Order> {
    const { data } = await api.post<OrderResponse>('/client/orders', payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    })
    return data.data
  },

  async getOrder(id: string): Promise<Order> {
    const { data } = await api.get<OrderResponse>(`/client/orders/${id}`)
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

  async getActiveOrders(signal?: AbortSignal): Promise<ActiveOrder[]> {
    const { data } = await api.get<ActiveOrdersResponse>('/client/orders/active', { signal })
    return data.data
  },
}
