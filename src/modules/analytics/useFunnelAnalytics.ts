import { onScopeDispose, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { AnalyticsService, type AnalyticsPayload, type FunnelEvent } from './analytics.service'
import { sourceLabels } from './source'

const MAX_EVENTS = 20

type Scope = { branchId: string; enabled: boolean; epoch: number; identity: string; accessToken: string | null }

export function createFunnelTracker(getScope: () => Scope, send = AnalyticsService.send) {
  let pending: AnalyticsPayload[] | null = null
  let current: AbortController | null = null
  let generation = 0
  let visited = false

  const scopeKey = () => {
    const scope = getScope()
    return `${scope.identity}:${scope.epoch}:${scope.branchId}:${scope.enabled}`
  }
  const stop = watch(scopeKey, () => {
    generation++
    current?.abort()
    current = null
    pending = null
    visited = false
  }, { flush: 'sync' })

  function pump() {
    if (current || !pending?.length) return
    const scope = getScope()
    if (!scope.enabled || !scope.branchId) { pending = null; return }
    const payload = pending.shift()!
    const controller = new AbortController()
    const requestGeneration = generation
    current = controller
    let request: Promise<void>
    try {
      request = send(payload, controller.signal, scope.accessToken)
    } catch (error) {
      request = Promise.reject(error)
    }
    void request.catch(() => {
      // Analytics is best effort and must not affect user actions.
    }).finally(() => {
      if (requestGeneration !== generation) return
      current = null
      if (!pending?.length) pending = null
      else pump()
    })
  }

  function track(event: FunnelEvent) {
    try {
      const scope = getScope()
      if (!scope.enabled || !scope.branchId) return
      if (event === 'visit' && visited) return
      if ((pending?.length ?? 0) + Number(current !== null) >= MAX_EVENTS) return
      const payload: AnalyticsPayload = {
        event_id: crypto.randomUUID(),
        branch_id: scope.branchId,
        event,
      }
      if (event === 'visit' || event === 'menu_view') {
        Object.assign(payload, sourceLabels(window.location.search, Boolean(document.referrer)))
      }
      if (event === 'visit') visited = true
      pending ??= []
      pending.push(payload)
      pump()
    } catch {
      // Missing browser APIs and malformed source data must not break the action.
    }
  }

  function dispose() {
    generation++
    current?.abort()
    current = null
    pending = null
    visited = false
    stop()
  }

  return { track, dispose }
}

export const useFunnelAnalytics = defineStore('funnelAnalytics', () => {
  const branch = useBranchStore()
  const auth = useAuthStore()
  const tracker = createFunnelTracker(() => ({
    branchId: branch.activeBranch?.id ?? '',
    enabled: branch.activeBranch?.branch_info?.analytics_funnel_enabled === true,
    epoch: auth.sessionEpoch,
    identity: auth.client?.id ?? 'guest',
    accessToken: auth.accessToken,
  }))
  onScopeDispose(tracker.dispose)
  return { track: tracker.track }
})
