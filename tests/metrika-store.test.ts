import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { reactive, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
const transport = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), load: vi.fn(), ym: vi.fn() }))
const auth = reactive({ client: null as { id: string } | null, sessionEpoch: 1, accessToken: null as string | null })
const branch = reactive({ activeBranch: { id: 'branch-a' } })
vi.mock('axios', () => ({ default: { create: () => ({ get: transport.get, post: transport.post }) } }))
vi.mock('@/utils/env', () => ({ getApiBaseUrl: () => 'https://api.test' }))
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('../src/modules/analytics/metrika', async importOriginal => ({
  ...await importOriginal<typeof import('../src/modules/analytics/metrika')>(), loadMetrikaSdk: transport.load,
}))
import { useMetrikaAnalytics } from '../src/modules/analytics/useMetrikaAnalytics'
const disabled = { data: { data: { enabled: false, counter_id: null, generation: 1, ecommerce: false, capture: false, collection_basis: 'disabled' } } }
const enabled = { data: { data: { enabled: true, counter_id: '123', generation: 1, ecommerce: true, capture: true, collection_basis: 'admin_approved' } } }
let store: ReturnType<typeof useMetrikaAnalytics> | undefined
const flush = async () => { await nextTick(); await Promise.resolve(); await Promise.resolve(); await nextTick() }
beforeEach(() => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
  auth.client = null; auth.sessionEpoch = 1; auth.accessToken = null
  branch.activeBranch.id = 'branch-a'
  vi.stubGlobal('window', { location: { href: 'https://shop.test/center', origin: 'https://shop.test', search: '' } })
  vi.stubGlobal('document', { referrer: '' })
  transport.get.mockReset().mockResolvedValue(disabled)
  transport.post.mockReset().mockResolvedValue({})
  transport.ym.mockReset()
  transport.load.mockReset().mockResolvedValue(transport.ym)
})
afterEach(() => { store?.$dispose(); store = undefined; vi.useRealTimers(); vi.unstubAllGlobals() })

it('disabled config only polls our config endpoint and allocates no provider layer', async () => {
  store = useMetrikaAnalytics(); store.start()
  await flush()
  store.track('cart_add')
  await vi.advanceTimersByTimeAsync(20_000)
  expect(transport.get).toHaveBeenCalledTimes(2)
  expect(transport.load).not.toHaveBeenCalled()
  expect(transport.post).not.toHaveBeenCalled()
  expect(window).not.toHaveProperty('delivestMetrikaLayer')
})

it('a stale config response cannot reenable the old branch after identity changes', async () => {
  let resolve!: (value: unknown) => void
  transport.get.mockReturnValueOnce(new Promise(done => { resolve = done })).mockResolvedValue(disabled)
  store = useMetrikaAnalytics(); store.start()
  const signal = transport.get.mock.calls[0]?.[1].signal as AbortSignal
  auth.sessionEpoch++
  auth.client = { id: 'client-b' }
  branch.activeBranch.id = 'branch-b'
  resolve(enabled)
  await flush()
  expect(signal.aborted).toBe(true)
  expect(transport.load).not.toHaveBeenCalled()
  expect(transport.post).not.toHaveBeenCalled()
})

it('disabling during poll destroys a loaded counter and fences late getClientID callbacks', async () => {
  transport.get.mockResolvedValueOnce(enabled).mockResolvedValue(disabled)
  store = useMetrikaAnalytics(); store.start()
  await flush()
  const callback = transport.ym.mock.calls.find(([, method]) => method === 'getClientID')?.[2] as (value: string) => void
  expect(callback).toBeTypeOf('function')
  await vi.advanceTimersByTimeAsync(20_000)
  callback('12345')
  expect(transport.ym).toHaveBeenCalledWith('123', 'destruct')
  expect(transport.post).not.toHaveBeenCalled()
})

it('pre-order identity flush has a fixed 200ms ceiling even when optional capture stalls', async () => {
  vi.stubGlobal('window', { location: { href: 'https://shop.test/center?yclid=123', origin: 'https://shop.test', search: '?yclid=123' } })
  transport.get.mockResolvedValue(enabled)
  transport.post.mockReturnValue(new Promise(() => undefined))
  store = useMetrikaAnalytics(); store.start()
  await flush()
  let finished = false
  const waiting = store.flushIdentity().then(() => { finished = true })
  await vi.advanceTimersByTimeAsync(199)
  expect(finished).toBe(false)
  await vi.advanceTimersByTimeAsync(1)
  await waiting
  expect(finished).toBe(true)
})
