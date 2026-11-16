import { api } from '@/api/client'
import type { components } from '@/api/types'

export type GeoAddress = components['schemas']['GeoAddress']

type Envelope<T> = { data: T }

export const GeoService = {
  async suggest(query: string, city: string | null = null): Promise<GeoAddress[]> {
    const { data } = await api.get<Envelope<GeoAddress[]>>('/client/geo/suggest', {
      params: city ? { query, city_boost: city } : { query },
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
