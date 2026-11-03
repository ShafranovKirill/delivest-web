import { sameCity } from '../utils/deliveryAddress'
import { api } from '@/api/client'
import type { components } from '@/api/types'

export type GeoAddress = components['schemas']['GeoAddress']

type Envelope<T> = { data: T }

export const GeoService = {
  async suggest(query: string, city: string | null): Promise<GeoAddress[]> {
    const scopedQuery = city && !query.toLowerCase().includes(city.toLowerCase())
      ? `${city} ${query}`
      : query
    const { data } = await api.get<Envelope<GeoAddress[]>>('/client/geo/suggest', {
      params: { query: scopedQuery, city: city ?? undefined },
    })
    if (data.data.length || !city) return data.data

    const { data: fallback } = await api.get<Envelope<GeoAddress[]>>('/client/geo/suggest', {
      params: { query: scopedQuery },
    })
    return fallback.data.filter((address) => address.city && sameCity(address.city, city))
  },

  async reverse(latitude: number, longitude: number): Promise<GeoAddress | null> {
    const { data } = await api.get<Envelope<GeoAddress[]>>('/client/geo/reverse', {
      params: { latitude, longitude },
    })
    return data.data[0] ?? null
  },
}
