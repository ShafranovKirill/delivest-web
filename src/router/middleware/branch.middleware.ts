import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { RouteLocationNormalized } from 'vue-router'

export async function branchMiddleware(to: RouteLocationNormalized) {
  const branchStore = useBranchStore()

  if (!branchStore.isInitialized) {
    try {
      await branchStore.initBranches()
    } catch {
      if (to.name !== 'select-branch') {
        return { name: 'select-branch' }
      }
      return true
    }
  }

  const urlSlug = to.params.slug as string | undefined
  const cookieBranchId = branchStore.getBranchIdFromCookie()

  const activeBranches = branchStore.branches.filter((b) => b.is_active)

  const branchByCookie = cookieBranchId
    ? activeBranches.find((b) => b.id === cookieBranchId)
    : undefined

  const preferredBranch = branchByCookie ?? (activeBranches.length === 1 ? activeBranches[0] : null)

  if (urlSlug) {
    try {
      if (branchStore.activeBranch?.slug !== urlSlug) {
        await branchStore.selectBranchBySlug(urlSlug)
      }
      return true
    } catch {
      return { name: 'select-branch' }
    }
  }

  if (preferredBranch) {
    try {
      if (branchStore.activeBranch?.id !== preferredBranch.id) {
        await branchStore.selectBranch(preferredBranch)
      }

      if (to.name === 'select-branch' || to.path === '/') {
        return `/${preferredBranch.slug}`
      }
      return true
    } catch {
      return { name: 'select-branch' }
    }
  }

  if (to.name !== 'select-branch') {
    return { name: 'select-branch' }
  }

  return true
}
