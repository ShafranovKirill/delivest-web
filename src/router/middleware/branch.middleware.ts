import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { RouteLocationNormalized } from 'vue-router'

export async function branchGuard(to: RouteLocationNormalized) {
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

  const branchByCookie = cookieBranchId
    ? branchStore.branches.find((b) => b.id === cookieBranchId && b.is_active)
    : null

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

  if (branchByCookie) {
    try {
      if (branchStore.activeBranch?.id !== branchByCookie.id) {
        await branchStore.selectBranch(branchByCookie)
      }

      if (to.name === 'select-branch' || to.path === '/') {
        return `/${branchByCookie.slug}`
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
