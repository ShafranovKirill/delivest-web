import { afterEach, expect, it, vi } from 'vitest'
import { effectScope, nextTick, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
const auth = reactive({ client: null as { id: string } | null, sessionEpoch: 1, accessToken: null as string | null })
const branch = reactive({ activeBranch: { id: 'branch', branch_info: { analytics_funnel_enabled: true } } })
const serviceSend = vi.hoisted(() => vi.fn())
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('../src/modules/analytics/analytics.service', () => ({ AnalyticsService: { send: serviceSend } }))
import { createFunnelTracker, useFunnelAnalytics } from '../src/modules/analytics/useFunnelAnalytics'
import { sourceLabels } from '../src/modules/analytics/source'

function deferred() {
  let resolve!: () => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}
const originalCrypto = globalThis.crypto
afterEach(() => {
  vi.stubGlobal('crypto', originalCrypto)
  vi.unstubAllGlobals()
})

it('scrubs source labels and never returns raw URLs or phone-like values', () => {
  expect(sourceLabels('', false)).toEqual({ source_type: 'direct' })
  expect(sourceLabels('', true)).toEqual({ source_type: 'unknown' })
  expect(sourceLabels('?utm_source=mail&utm_medium=email&utm_campaign=sale_1', false)).toEqual({
    source_type: 'campaign', utm_source: 'mail', utm_medium: 'email', utm_campaign: 'sale_1',
  })
  expect(sourceLabels('?utm_source=https%3A%2F%2Fexample.com%2Fa%3Fphone%3D1234567', false)).toEqual({ source_type: 'unknown' })
  expect(sourceLabels('?utm_source=7999-123-45-67', false)).toEqual({ source_type: 'unknown' })
  expect(sourceLabels(`?utm_campaign=${'a'.repeat(65)}`, false)).toEqual({ source_type: 'unknown' })
})

it('off dispatches nothing and does not create event IDs', () => {
  const uuid = vi.fn(() => 'uuid')
  vi.stubGlobal('crypto', { randomUUID: uuid })
  const scopeState = reactive({ branchId: 'branch', enabled: false, epoch: 1, identity: 'guest', accessToken: null })
  const send = vi.fn()
  const scope = effectScope()
  const tracker = scope.run(() => createFunnelTracker(() => scopeState, send))!
  tracker.track('cart_add')
  expect(send).not.toHaveBeenCalled()
  expect(uuid).not.toHaveBeenCalled()
  tracker.dispose()
  scope.stop()
})

it('sends a single visit with only allowlisted attribution fields', () => {
  vi.stubGlobal('window', { location: { search: '?utm_source=mail&utm_campaign=7999-123-45-67&phone=secret' } })
  vi.stubGlobal('document', { referrer: 'https://example.com/private' })
  vi.stubGlobal('crypto', { randomUUID: () => 'event-uuid' })
  const scopeState = reactive({ branchId: 'branch', enabled: true, epoch: 1, identity: 'guest', accessToken: null })
  const send = vi.fn().mockReturnValue(deferred().promise)
  const scope = effectScope()
  const tracker = scope.run(() => createFunnelTracker(() => scopeState, send))!
  tracker.track('visit')
  tracker.track('visit')
  expect(send).toHaveBeenCalledTimes(1)
  expect(send.mock.calls[0]?.[0]).toEqual({
    event_id: 'event-uuid', branch_id: 'branch', event: 'visit', source_type: 'campaign', utm_source: 'mail',
  })
  tracker.dispose()
  scope.stop()
})

it('serializes first guest events, bounds memory, discards on scope change, and continues after errors', async () => {
  const scopeState = reactive({ branchId: 'branch', enabled: true, epoch: 1, identity: 'guest', accessToken: null })
  const first = deferred()
  const second = deferred()
  const uuid = vi.fn(() => 'uuid')
  vi.stubGlobal('crypto', { randomUUID: uuid })
  const send = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockResolvedValue(undefined)
  const scope = effectScope()
  const tracker = scope.run(() => createFunnelTracker(() => scopeState, send))!
  tracker.track('cart_add')
  tracker.track('product_view')
  expect(send).toHaveBeenCalledTimes(1)
  expect(send.mock.calls[0]?.[0].event).toBe('cart_add')
  first.reject(new Error('offline'))
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(send).toHaveBeenCalledTimes(2)
  expect(send.mock.calls[1]?.[0].event).toBe('product_view')
  for (let i = 0; i < 40; i++) tracker.track('cart_add')
  expect(uuid).toHaveBeenCalledTimes(21)
  const oldSignal = send.mock.calls[1]?.[1] as AbortSignal
  scopeState.epoch++
  expect(oldSignal.aborted).toBe(true)
  second.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(send).toHaveBeenCalledTimes(2)
  tracker.track('cart_add')
  expect(send).toHaveBeenCalledTimes(3)
  scopeState.enabled = false
  tracker.track('cart_add')
  expect(send).toHaveBeenCalledTimes(3)
  tracker.dispose()
  scope.stop()
})

it('keeps the scope fence after the first consumer unmounts', () => {
  setActivePinia(createPinia())
  auth.sessionEpoch = 1
  branch.activeBranch.branch_info.analytics_funnel_enabled = true
  const pending = deferred()
  serviceSend.mockReset().mockReturnValue(pending.promise)
  const consumer = effectScope()
  const tracker = consumer.run(() => useFunnelAnalytics())!
  tracker.track('cart_add')
  const signal = serviceSend.mock.calls[0]?.[1] as AbortSignal
  consumer.stop()
  auth.sessionEpoch++
  expect(signal.aborted).toBe(true)
  pending.resolve()
  const next = deferred()
  serviceSend.mockReturnValue(next.promise)
  tracker.track('cart_add')
  const nextSignal = serviceSend.mock.calls[1]?.[1] as AbortSignal
  tracker.$dispose()
  expect(nextSignal.aborted).toBe(true)
  next.resolve()
})

it('swallows synchronous transport and ID failures', async () => {
  const scopeState = reactive({ branchId: 'branch', enabled: true, epoch: 1, identity: 'guest', accessToken: null })
  const send = vi.fn().mockImplementationOnce(() => { throw new Error('transport') }).mockResolvedValue(undefined)
  const scope = effectScope()
  const tracker = scope.run(() => createFunnelTracker(() => scopeState, send))!
  expect(() => tracker.track('cart_add')).not.toThrow()
  tracker.track('cart_add')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(send).toHaveBeenCalledTimes(2)
  vi.stubGlobal('crypto', { randomUUID: () => { throw new Error('no crypto') } })
  expect(() => tracker.track('cart_add')).not.toThrow()
  tracker.dispose()
  scope.stop()
})
