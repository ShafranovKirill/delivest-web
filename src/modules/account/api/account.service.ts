import { api } from '@/api/client'
import type { components } from '@/api/types'
import type { ActiveOrder } from '@/modules/order/api/order.service'

export type ClientAddress = components['schemas']['ClientAddress']
export type AddressPayload = components['schemas']['ClientAddressRequest']

type Envelope<T> = { data: T }

export type LoyaltyEntry = {
  id: string
  kind: 'accrual' | 'accrual_reversal' | 'expire' | 'adjust'
  amount: number
  order_id: string | null
  expires_at: string | null
  inserted_at: string
}

export type Loyalty = {
  enabled: boolean
  balance: number
  history: LoyaltyEntry[]
}

export const AccountService = {
  async getOrders(): Promise<ActiveOrder[]> {
    const { data } = await api.get<Envelope<ActiveOrder[]>>('/client/orders')
    return data.data
  },

  async getLoyalty(branchId: string): Promise<Loyalty> {
    const { data } = await api.get<Envelope<Loyalty>>('/client/loyalty', {
      params: { branch_id: branchId },
    })
    return data.data
  },

  async getAddresses(): Promise<ClientAddress[]> {
    const { data } = await api.get<Envelope<ClientAddress[]>>('/client/addresses')
    return data.data
  },

  async createAddress(payload: AddressPayload): Promise<ClientAddress> {
    const { data } = await api.post<Envelope<ClientAddress>>('/client/addresses', payload)
    return data.data
  },

  async updateAddress(id: string, payload: AddressPayload): Promise<ClientAddress> {
    const { data } = await api.put<Envelope<ClientAddress>>(`/client/addresses/${id}`, payload)
    return data.data
  },

  async deleteAddress(id: string): Promise<void> {
    await api.delete(`/client/addresses/${id}`)
  },
}
