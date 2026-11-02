import type { Branch } from '@/modules/branch/api/branch.service'
export type FulfillmentMethod = 'delivery' | 'pickup' | 'dine_in'
export function fulfillmentMethods(branch: Branch | null | undefined): FulfillmentMethod[] {
  return branch?.branch_info?.fulfillment_methods ?? ['delivery', 'pickup', 'dine_in']
}
export function hasOnsite(branch: Branch | null | undefined): boolean {
  const methods = fulfillmentMethods(branch)
  return methods.includes('pickup') || methods.includes('dine_in')
}
