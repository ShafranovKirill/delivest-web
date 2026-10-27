import type { Branch } from '@/modules/branch/api/branch.service'
import type { LngLat } from './deliveryAddress'

const FALLBACK: LngLat = [37.6176, 55.7558]

export function branchLngLat(branch: Branch | null | undefined): LngLat | null {
  const settings = branch?.branch_info?.ycart_settings as
    { latitude?: number | null; longitude?: number | null } | null | undefined
  if (settings?.latitude == null || settings?.longitude == null) return null
  return [settings.longitude, settings.latitude]
}

export function fallbackLngLat(branches: Branch[]): LngLat {
  return branches.map(branchLngLat).find(Boolean) ?? FALLBACK
}
