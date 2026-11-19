import { afterEach, expect, it, vi } from 'vitest'
import { effectScope, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
const auth = reactive({ client: null as { id: string } | null, sessionEpoch: 1, accessToken: null as string | null })
const branch = reactive({ activeBranch: { id: 'branch', branch_info: { analytics_funnel_enabled: true } } })
const serviceSend = vi.hoisted(() => vi.fn())
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('../src/modules/analytics/analytics.service', () => ({ AnalyticsService: { sendBatch: serviceSend } }))
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
  vi.useRealTimers()
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

it('sends a single visit after one second with only allowlisted attribution fields', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('window', { location: { search: '?utm_source=mail&utm_campaign=7999-123-45-67&phone=secret' } })
  vi.stubGlobal('document', { referrer: 'https://example.com/private' })
  vi.stubGlobal('crypto', { randomUUID: () => 'event-uuid' })
  const scopeState = reactive({ branchId: 'branch', enabled: true, epoch: 1, identity: 'guest', accessToken: null })
  const send = vi.fn().mockReturnValue(deferred().promise)
  const scope = effectScope()
  const tracker = scope.run(() => createFunnelTracker(() => scopeState, send))!
  tracker.track('visit')
  tracker.track('visit')
  expect(send).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1000)
  expect(send).toHaveBeenCalledTimes(1)
  expect(send.mock.calls[0]?.[0]).toEqual([{
    event_id: 'event-uuid', branch_id: 'branch', event: 'visit', source_type: 'campaign', utm_source: 'mail',
  }])
  tracker.dispose()
  scope.stop()
})

it('flushes at 20, bounds pending memory, discards on scope change, and continues after errors', async () => {
  vi.useFakeTimers()
  const scopeState = reactive({ branchId: 'branch', enabled: true, epoch: 1, identity: 'client', accessToken: 'token' })
  const first = deferred()
  const second = deferred()
  const uuid = vi.fn(() => 'uuid')
  vi.stubGlobal('crypto', { randomUUID: uuid })
  const send = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockResolvedValue(undefined)
  const scope = effectScope()
  const tracker = scope.run(() => createFunnelTracker(() => scopeState, send))!
  for (let i = 0; i < 20; i++) tracker.track('cart_add')
  expect(send).toHaveBeenCalledTimes(1)
  expect(send.mock.calls[0]?.[0]).toHaveLength(20)
  for (let i = 0; i < 40; i++) tracker.track('product_view')
  expect(uuid).toHaveBeenCalledTimes(40)
  first.reject(new Error('offline'))
  await vi.advanceTimersByTimeAsync(1000)
  expect(send).toHaveBeenCalledTimes(2)
  expect(send.mock.calls[1]?.[0]).toHaveLength(20)
  const oldSignal = send.mock.calls[1]?.[1] as AbortSignal
  scopeState.epoch++
  expect(oldSignal.aborted).toBe(true)
  second.resolve()
  await vi.advanceTimersByTimeAsync(1000)
  expect(send).toHaveBeenCalledTimes(2)
  tracker.track('cart_add')
  await vi.advanceTimersByTimeAsync(1000)
  expect(send).toHaveBeenCalledTimes(3)
  scopeState.enabled = false
  tracker.track('cart_add')
  expect(send).toHaveBeenCalledTimes(3)
  tracker.dispose()
  scope.stop()
})

it('keeps the scope fence after the first consumer unmounts', () => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
  auth.sessionEpoch = 1
  branch.activeBranch.branch_info.analytics_funnel_enabled = true
  const pending = deferred()
  serviceSend.mockReset().mockReturnValue(pending.promise)
  const consumer = effectScope()
  const tracker = consumer.run(() => useFunnelAnalytics())!
  for (let i = 0; i < 20; i++) tracker.track('cart_add')
  const signal = serviceSend.mock.calls[0]?.[1] as AbortSignal
  consumer.stop()
  auth.sessionEpoch++
  expect(signal.aborted).toBe(true)
  pending.resolve()
  const next = deferred()
  serviceSend.mockReturnValue(next.promise)
  tracker.track('cart_add')
  tracker.track('cart_add')
  // Timer flush belongs to the store scope, not the first consumer scope.
  tracker.$dispose()
  next.resolve()
})

it('pagehide sends a bounded keepalive packet and identity change clears remaining events', () => {
  let onPagehide!: () => void
  vi.stubGlobal('window', {
    location: { search: '' },
    addEventListener: (name: string, callback: () => void) => { if (name === 'pagehide') onPagehide = callback },
    removeEventListener: vi.fn(),
  })
  vi.stubGlobal('document', { referrer: '' })
  let serial = 0
  vi.stubGlobal('crypto', { randomUUID: () => `event-${++serial}` })
  const scopeState = reactive({ branchId: 'branch', enabled: true, epoch: 1, identity: 'guest', accessToken: null })
  const send = vi.fn().mockResolvedValue(undefined)
  const scope = effectScope()
  const tracker = scope.run(() => createFunnelTracker(() => scopeState, send))!
  tracker.track('cart_add')
  tracker.track('menu_view')
  onPagehide()
  expect(send).toHaveBeenCalledTimes(1)
  expect(send.mock.calls[0]?.[0].map((event: { event_id: string }) => event.event_id)).toEqual(['event-1', 'event-2'])
  expect(send.mock.calls[0]?.[3]).toBeUndefined()
  const keepaliveSignal = send.mock.calls[0]?.[1] as AbortSignal
  scopeState.epoch++
  expect(keepaliveSignal.aborted).toBe(true)
  tracker.dispose()
  expect(send).toHaveBeenCalledTimes(1)
  scope.stop()
})

it('pagehide and dispose do not resend the in-flight guest packet or abort its keepalive', async () => {
  let onPagehide!: () => void
  vi.stubGlobal('window', {
    location: { search: '' },
    addEventListener: (name: string, callback: () => void) => { if (name === 'pagehide') onPagehide = callback },
    removeEventListener: vi.fn(),
  })
  vi.stubGlobal('document', { referrer: '' })
  let serial = 0
  vi.stubGlobal('crypto', { randomUUID: () => `event-${++serial}` })
  const scopeState = reactive({ branchId: 'branch', enabled: true, epoch: 1, identity: 'guest', accessToken: null })
  const first = deferred()
  const second = deferred()
  const send = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
  const scope = effectScope()
  const tracker = scope.run(() => createFunnelTracker(() => scopeState, send))!
  for (let i = 0; i < 20; i++) tracker.track('cart_add')
  tracker.track('menu_view')
  const firstIds = send.mock.calls[0]?.[0].map((event: { event_id: string }) => event.event_id)
  onPagehide()
  tracker.dispose()
  expect(send).toHaveBeenCalledTimes(1)
  expect((send.mock.calls[0]?.[1] as AbortSignal).aborted).toBe(false)
  first.resolve()
  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2))
  expect(send.mock.calls[0]?.[0].map((event: { event_id: string }) => event.event_id)).toEqual(firstIds)
  expect(send.mock.calls[1]?.[0].map((event: { event_id: string }) => event.event_id)).toEqual(['event-21'])
  second.resolve()
  scope.stop()
})

it('swallows synchronous transport and ID failures', async () => {
  vi.useFakeTimers()
  const scopeState = reactive({ branchId: 'branch', enabled: true, epoch: 1, identity: 'guest', accessToken: null })
  const send = vi.fn().mockImplementationOnce(() => { throw new Error('transport') }).mockResolvedValue(undefined)
  const scope = effectScope()
  const tracker = scope.run(() => createFunnelTracker(() => scopeState, send))!
  expect(() => tracker.track('cart_add')).not.toThrow()
  tracker.track('cart_add')
  await vi.advanceTimersByTimeAsync(1000)
  expect(send).toHaveBeenCalledTimes(1)
  tracker.track('cart_add')
  await vi.advanceTimersByTimeAsync(1000)
  expect(send).toHaveBeenCalledTimes(2)
  vi.stubGlobal('crypto', { randomUUID: () => { throw new Error('no crypto') } })
  expect(() => tracker.track('cart_add')).not.toThrow()
  tracker.dispose()
  scope.stop()
})

it('sends unbatched events immediately in order and clears queued events on epoch reset', async () => {
  vi.stubGlobal('window', {
    _env: { VITE_FUNNEL_BATCHING: 'false' },
    location: { search: '' }, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })
  vi.stubGlobal('document', { referrer: '' })
  let serial = 0
  vi.stubGlobal('crypto', { randomUUID: () => `event-${++serial}` })
  const scopeState = reactive({ branchId: 'branch', enabled: true, epoch: 1, identity: 'guest', accessToken: null })
  const first = deferred()
  const batch = vi.fn()
  const single = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue(undefined)
  const scope = effectScope()
  const tracker = scope.run(() => createFunnelTracker(() => scopeState, batch, single))!
  tracker.track('cart_add')
  tracker.track('menu_view')
  expect(single).toHaveBeenCalledOnce()
  expect(single.mock.calls[0]?.[0].event_id).toBe('event-1')
  expect(batch).not.toHaveBeenCalled()
  first.resolve()
  await vi.waitFor(() => expect(single).toHaveBeenCalledTimes(2))
  expect(single.mock.calls[1]?.[0].event_id).toBe('event-2')

  const delayed = deferred()
  single.mockReturnValueOnce(delayed.promise)
  tracker.track('cart_add')
  tracker.track('cart_add')
  scopeState.epoch++
  expect((single.mock.calls[2]?.[1] as AbortSignal).aborted).toBe(true)
  delayed.resolve()
  await Promise.resolve()
  expect(single).toHaveBeenCalledTimes(3)
  tracker.dispose()
  scope.stop()
})
