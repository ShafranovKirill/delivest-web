import type { Branch } from '@/modules/branch/api/branch.service'
import type { LngLat } from './deliveryAddress'

const FALLBACK: LngLat = [37.6176, 55.7558]

export function branchLngLat(branch: Branch | null | undefined): LngLat | null {
  const info = branch?.branch_info
  if (info?.latitude == null || info?.longitude == null) return null
  return [info.longitude, info.latitude]
}

export function fallbackLngLat(branches: Branch[]): LngLat {
  return branches.map(branchLngLat).find(Boolean) ?? FALLBACK
}
