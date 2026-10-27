import { api } from '@/api/client'
import type { components } from '@/api/types'

export type DeliveryQuote = components['schemas']['DeliveryQuote']
export type DeliveryZone = components['schemas']['DeliveryZone']

type Envelope<T> = { data: T }

export const DeliveryService = {
  async quote(
    branchId: string,
    latitude: number | null,
    longitude: number | null,
    subtotal: number,
  ): Promise<DeliveryQuote> {
    const { data } = await api.get<Envelope<DeliveryQuote>>('/client/delivery/quote', {
      params: {
        branch_id: branchId,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        subtotal,
      },
    })
    return data.data
  },

  async zones(branchId: string): Promise<DeliveryZone[]> {
    const { data } = await api.get<Envelope<DeliveryZone[]>>('/client/delivery/zones', {
      params: { branch_id: branchId },
    })
    return data.data
  },
}
