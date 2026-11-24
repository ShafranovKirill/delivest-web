import type { Branch } from '@/modules/branch/api/branch.service'

type CourierBranch = Pick<Branch, 'id' | 'branch_info'>

export function courierDetailsEnabled(
  orderBranchId: string,
  provider: string | undefined,
  branches: CourierBranch[],
  activeBranch: CourierBranch | null,
): boolean {
  const branch =
    branches.find((candidate) => candidate.id === orderBranchId) ??
    (activeBranch?.id === orderBranchId ? activeBranch : null)

  if (provider === 'staff') return branch?.branch_info?.couriers_enabled === true
  if (provider === 'yandex') return branch?.branch_info?.yandex_delivery_enabled === true
  return false
}
