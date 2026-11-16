import { onScopeDispose, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { SourceClaimService } from './sourceClaim.service'

export const useSourceClaim = defineStore('sourceClaim', () => {
  const auth = useAuthStore()
  const branch = useBranchStore()
  let current: AbortController | null = null
  let claimedScope: string | null = null

  const stop = watch(
    () => [auth.sessionEpoch, auth.client?.id, auth.accessToken, auth.isAuthenticated,
      branch.activeBranch?.id, branch.activeBranch?.branch_info?.analytics_links_enabled] as const,
    () => {
      if (current) {
        current.abort()
        current = null
        claimedScope = null
      }
      const clientId = auth.client?.id
      const token = auth.accessToken
      const activeBranch = branch.activeBranch
      if (!clientId || !token || !auth.isAuthenticated ||
          !activeBranch?.id || activeBranch.branch_info?.analytics_links_enabled !== true) return
      const scope = `${auth.sessionEpoch}:${clientId}:${activeBranch.id}`
      if (claimedScope === scope) return
      claimedScope = scope
      const request = new AbortController()
      current = request
      void SourceClaimService.claim(token, request.signal)
        .catch(() => {
          /* Optional analytics must not affect authentication or navigation. */
        })
        .finally(() => {
          if (current === request) current = null
        })
    },
    { immediate: true, flush: 'post' },
  )

  onScopeDispose(() => {
    current?.abort()
    stop()
  })
  return {}
})
