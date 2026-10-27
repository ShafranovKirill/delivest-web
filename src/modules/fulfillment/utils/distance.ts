import type { LngLat } from './deliveryAddress'

const EARTH_RADIUS_M = 6_371_000

const radians = (degrees: number) => (degrees * Math.PI) / 180

export function distanceMeters([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): number {
  const dLat = radians(lat2 - lat1)
  const dLng = radians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}
