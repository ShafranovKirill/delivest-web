import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { RouteLocationNormalized } from 'vue-router'
import { publicLandingTarget } from '../publicLanding'
import { primeSession } from '../primeSession'

export async function branchMiddleware(to: RouteLocationNormalized) {
  const branchStore = useBranchStore()
  const urlSlug = to.params.slug as string | undefined

  if (urlSlug) {
    try {
      if (branchStore.activeBranch?.slug !== urlSlug) await branchStore.selectBranchBySlug(urlSlug)
      primeSession()
      return true
    } catch {
      const target = publicLandingTarget(to.fullPath)
      return { name: 'select-branch', query: target ? { return_to: target } : {} }
    }
  }

  if (!branchStore.isInitialized) {
    try {
      await branchStore.initBranches()
    } catch {
      if (to.name !== 'select-branch') {
        const target = publicLandingTarget(to.fullPath)
        return { name: 'select-branch', query: target ? { return_to: target } : {} }
      }
      return true
    }
  }

  const cookieBranchId = branchStore.getBranchIdFromCookie()

  const activeBranches = branchStore.branches.filter((b) => b.is_active)

  const branchByCookie = cookieBranchId
    ? activeBranches.find((b) => b.id === cookieBranchId)
    : undefined

  const preferredBranch = branchByCookie ?? (activeBranches.length === 1 ? activeBranches[0] : null)

  if (to.name === 'select-branch' && publicLandingTarget(to.query.return_to)) return true

  if (preferredBranch) {
    try {
      if (branchStore.activeBranch?.id !== preferredBranch.id) {
        await branchStore.selectBranch(preferredBranch)
      }
      primeSession()

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
