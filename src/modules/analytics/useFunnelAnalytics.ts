import { onScopeDispose, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { AnalyticsService, type AnalyticsPayload, type FunnelEvent } from './analytics.service'
import { sourceLabels } from './source'
import { useMetrikaAnalytics } from './useMetrikaAnalytics'
import { funnelBatchingEnabled } from '@/api/storefrontPolicy'

const MAX_EVENTS = 20

type Scope = { branchId: string; enabled: boolean; epoch: number; identity: string; accessToken: string | null }

export function createFunnelTracker(getScope: () => Scope, send = AnalyticsService.sendBatch, sendSingle = AnalyticsService.send) {
  let pending: AnalyticsPayload[] = []
  let current: { controller: AbortController } | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let generation = 0
  let visited = false
  let closing = false

  const scopeKey = () => {
    const scope = getScope()
    return `${scope.identity}:${scope.epoch}:${scope.branchId}:${scope.enabled}:${scope.accessToken ?? ''}`
  }
  const stop = watch(scopeKey, () => {
    generation++
    current?.controller.abort()
    current = null
    if (timer) clearTimeout(timer)
    timer = null
    pending = []
    visited = false
  }, { flush: 'sync' })

  function pump() {
    if (current || !pending.length) return
    const scope = getScope()
    if (!scope.enabled || !scope.branchId) { pending = []; return }
    const batching = funnelBatchingEnabled(scope.branchId)
    const payload = pending.splice(0, batching ? MAX_EVENTS : 1)
    const controller = new AbortController()
    const requestGeneration = generation
    current = { controller }
    let request: Promise<void>
    try {
      request = batching
        ? send(payload, controller.signal, scope.accessToken)
        : sendSingle(payload[0]!, controller.signal, scope.accessToken)
    } catch (error) {
      request = Promise.reject(error)
    }
    let succeeded = false
    void request.then(() => { succeeded = true }).catch(() => {
      // Analytics is best effort and must not affect user actions.
    }).finally(() => {
      if (requestGeneration !== generation) { if (closing) stop(); return }
      current = null
      // Without the first guest acknowledgement, a second request could acquire
      // another owner cookie. Drop the remainder rather than split one visit.
      if (!succeeded && !scope.accessToken) pending = []
      if (pending.length && (closing || !timer)) pump()
      if (closing && !current) stop()
    })
  }

  function flush() {
    if (timer) clearTimeout(timer)
    timer = null
    const scope = getScope()
    if (!scope.enabled || !scope.branchId) { pending = []; return }
    pump()
  }

  const pagehide = () => flush()
  if (typeof window !== 'undefined') window.addEventListener?.('pagehide', pagehide)

  function track(event: FunnelEvent) {
    try {
      if (closing) return
      const scope = getScope()
      if (!scope.enabled || !scope.branchId) return
      if (event === 'visit' && visited) return
      const batching = funnelBatchingEnabled(scope.branchId)
      if (pending.length >= MAX_EVENTS) return
      const payload: AnalyticsPayload = {
        event_id: crypto.randomUUID(),
        branch_id: scope.branchId,
        event,
      }
      if (event === 'visit' || event === 'menu_view') {
        Object.assign(payload, sourceLabels(window.location.search, Boolean(document.referrer)))
      }
      if (event === 'visit') visited = true
      pending.push(payload)
      if (!batching) pump()
      else if (pending.length === MAX_EVENTS) flush()
      else if (!timer) timer = setTimeout(() => flush(), 1000)
    } catch {
      // Missing browser APIs and malformed source data must not break the action.
    }
  }

  function dispose() {
    closing = true
    flush()
    if (!current) stop()
    if (typeof window !== 'undefined') window.removeEventListener?.('pagehide', pagehide)
  }

  return { track, flush, dispose }
}

export const useFunnelAnalytics = defineStore('funnelAnalytics', () => {
  const branch = useBranchStore()
  const auth = useAuthStore()
  const metrika = useMetrikaAnalytics()
  const tracker = createFunnelTracker(() => ({
    branchId: branch.activeBranch?.id ?? '',
    enabled: branch.activeBranch?.branch_info?.analytics_funnel_enabled === true,
    epoch: auth.sessionEpoch,
    identity: auth.client?.id ?? 'guest',
    accessToken: auth.accessToken,
  }))
  onScopeDispose(tracker.dispose)
  return {
    track: (event: FunnelEvent) => { tracker.track(event); metrika.track(event) },
    product: metrika.detail,
    closeProduct: metrika.closeDetail,
    cartChange: metrika.cartChange,
  }
})
