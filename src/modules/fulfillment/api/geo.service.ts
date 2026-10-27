import { api } from '@/api/client'
import type { components } from '@/api/types'

export type GeoAddress = components['schemas']['GeoAddress']

type Envelope<T> = { data: T }

export const GeoService = {
  async suggest(query: string, city: string | null): Promise<GeoAddress[]> {
    const { data } = await api.get<Envelope<GeoAddress[]>>('/client/geo/suggest', {
      params: { query, city: city ?? undefined },
    })
    return data.data
  },

  async reverse(latitude: number, longitude: number): Promise<GeoAddress | null> {
    const { data } = await api.get<Envelope<GeoAddress[]>>('/client/geo/reverse', {
      params: { latitude, longitude },
    })
    return data.data[0] ?? null
  },
}
