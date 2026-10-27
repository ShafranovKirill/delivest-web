import type { GeoAddress } from '../api/geo.service'
import type { ClientAddress } from '@/modules/account/api/account.service'

export interface DeliveryAddress {
  city: string
  street: string
  house: string
  entrance: string
  intercom: string
  floor: string
  apartment: string
  comment: string
  latitude: number | null
  longitude: number | null
}

export type LngLat = [number, number]

export function emptyDeliveryAddress(city = ''): DeliveryAddress {
  return {
    city,
    street: '',
    house: '',
    entrance: '',
    intercom: '',
    floor: '',
    apartment: '',
    comment: '',
    latitude: null,
    longitude: null,
  }
}

export function withGeo(address: DeliveryAddress, geo: GeoAddress): DeliveryAddress {
  return {
    ...address,
    city: geo.city ?? address.city,
    street: geo.street ?? '',
    house: geo.house ?? '',
    latitude: geo.latitude ?? null,
    longitude: geo.longitude ?? null,
  }
}

export function fromClientAddress(address: ClientAddress): DeliveryAddress {
  return {
    city: address.city ?? '',
    street: address.street ?? '',
    house: address.house ?? '',
    entrance: address.entrance ?? '',
    intercom: address.intercom ?? '',
    floor: address.floor ?? '',
    apartment: address.apartment ?? '',
    comment: address.comment ?? '',
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
  }
}

export function isComplete(address: DeliveryAddress): boolean {
  return Boolean(address.street.trim() && address.house.trim())
}

const normalizeCity = (city: string) =>
  city
    .trim()
    .toLowerCase()
    .replace(/^г\.?\s+/, '')

export function sameCity(city: string, branchCity: string | null | undefined): boolean {
  if (!branchCity || !city) return true
  return normalizeCity(city) === normalizeCity(branchCity)
}

export function streetLine(address: Pick<DeliveryAddress, 'street' | 'house'>): string {
  return [address.street, address.house].filter(Boolean).join(', ')
}

export function lngLatOf(address: DeliveryAddress): LngLat | null {
  if (address.latitude == null || address.longitude == null) return null
  return [address.longitude, address.latitude]
}

export function toAddressPayload(address: DeliveryAddress) {
  const text = (value: string) => value.trim() || null

  return {
    city: text(address.city),
    street: text(address.street),
    house: text(address.house),
    entrance: text(address.entrance),
    intercom: text(address.intercom),
    floor: text(address.floor),
    apartment: text(address.apartment),
    comment: text(address.comment),
    latitude: address.latitude,
    longitude: address.longitude,
  }
}
