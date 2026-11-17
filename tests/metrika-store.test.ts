import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { reactive, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
const transport = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), load: vi.fn(), ym: vi.fn(), menu: vi.fn() }))
const auth = reactive({ client: null as { id: string } | null, sessionEpoch: 1, accessToken: null as string | null })
const menu = reactive({ isProductModalOpen: false, activeProduct: null as { id: string; price: number } | null })
vi.mock('@/modules/menu/stores/menu.store', () => ({ useMenuStore: () => menu }))
const branch = reactive({ activeBranch: { id: 'branch-a' } })
vi.mock('axios', () => ({ default: { create: () => ({ get: transport.get, post: transport.post }) } }))
vi.mock('@/utils/env', () => ({ getApiBaseUrl: () => 'https://api.test' }))
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('../src/modules/analytics/metrika', async importOriginal => ({
  ...await importOriginal<typeof import('../src/modules/analytics/metrika')>(), loadMetrikaSdk: transport.load,
}))
import { useMetrikaAnalytics } from '../src/modules/analytics/useMetrikaAnalytics'
const disabled = { data: { data: { enabled: false, counter_id: null, generation: 1, feature_version: 'A'.repeat(43), ecommerce: false, capture: false, collection_basis: 'disabled' } } }
const enabled = { data: { data: { enabled: true, counter_id: '123', generation: 1, feature_version: 'A'.repeat(43), ecommerce: true, capture: true, collection_basis: 'admin_approved' } } }
let store: ReturnType<typeof useMetrikaAnalytics> | undefined
const flush = async () => { await nextTick(); await Promise.resolve(); await Promise.resolve(); await nextTick() }
beforeEach(() => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
  auth.client = null; auth.sessionEpoch = 1; auth.accessToken = null
  branch.activeBranch.id = 'branch-a'
  menu.isProductModalOpen = false; menu.activeProduct = null
  vi.stubGlobal('window', { location: { href: 'https://shop.test/center', origin: 'https://shop.test', pathname: '/center', search: '' } })
  vi.stubGlobal('document', { referrer: '', querySelector: transport.menu })
  transport.get.mockReset().mockResolvedValue(disabled)
  transport.post.mockReset().mockResolvedValue({})
  transport.ym.mockReset()
  transport.load.mockReset().mockResolvedValue(transport.ym)
  transport.menu.mockReset().mockReturnValue(null)
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
  vi.stubGlobal('window', { location: { href: 'https://shop.test/center?yclid=123', origin: 'https://shop.test', pathname: '/center', search: '?yclid=123' } })
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

it('late configuration records the currently visible loaded menu and forwards the feature version', async () => {
  let resolve!: (value: unknown) => void
  transport.get.mockReturnValueOnce(new Promise(done => { resolve = done }))
  transport.menu.mockReturnValue({ id: 'category-rendered' })
  store = useMetrikaAnalytics(); store.start()
  store.track('visit'); store.track('menu_view')
  resolve(enabled)
  await flush()
  store.track('visit'); store.track('menu_view')
  expect(transport.ym.mock.calls.filter(([, method]) => method === 'reachGoal').map(([, , goal]) => goal)).toEqual(['delivest_visit', 'delivest_menu_view'])
  const callback = transport.ym.mock.calls.find(([, method]) => method === 'getClientID')?.[2] as (value: string) => void
  callback('12345')
  expect(transport.post.mock.calls.at(-1)?.[1]).toEqual({ generation: 1, feature_version: 'A'.repeat(43), client_id: '12345' })
})

it('does not report a cached menu as visible while checkout is the current screen', async () => {
  vi.stubGlobal('window', { location: { href: 'https://shop.test/center/checkout', origin: 'https://shop.test', pathname: '/center/checkout', search: '' } })
  transport.menu.mockReturnValue({ id: 'category-rendered' })
  transport.get.mockResolvedValue(enabled)
  store = useMetrikaAnalytics(); store.start()
  await flush()
  expect(transport.ym.mock.calls.filter(([, method]) => method === 'reachGoal').map(([, , goal]) => goal)).toEqual(['delivest_visit'])
})

for (const duringLoad of [false, true]) {
  it(`recovers the current product goal without duplicates (opened during SDK load: ${duringLoad})`, async () => {
    let resolve!: (value: unknown) => void
    if (duringLoad) {
      transport.get.mockResolvedValue(enabled)
      transport.load.mockReturnValue(new Promise(done => { resolve = done }))
    } else transport.get.mockReturnValue(new Promise(done => { resolve = done }))
    store = useMetrikaAnalytics(); store.start()
    await flush()
    menu.isProductModalOpen = true
    menu.activeProduct = { id: '11111111-1111-4111-8111-111111111111', price: 100 }
    store.track('product_view'); store.detail(menu.activeProduct)
    resolve(duringLoad ? transport.ym : enabled)
    await flush()
    const goals = () => transport.ym.mock.calls.filter(([, method, goal]) => method === 'reachGoal' && goal === 'delivest_product_view')
    expect(goals()).toHaveLength(1)
    expect((window as unknown as { delivestMetrikaLayer: unknown[] }).delivestMetrikaLayer).toHaveLength(1)
    store.closeDetail()
    store.track('product_view'); store.detail(menu.activeProduct)
    expect(goals()).toHaveLength(2)
    menu.activeProduct = { id: '22222222-2222-4222-8222-222222222222', price: 100 }
    store.track('product_view'); store.detail(menu.activeProduct)
    expect(goals()).toHaveLength(3)
  })
}

it('does not recover a product closed before configuration arrives', async () => {
  let resolve!: (value: unknown) => void
  transport.get.mockReturnValue(new Promise(done => { resolve = done }))
  store = useMetrikaAnalytics(); store.start()
  menu.isProductModalOpen = true
  store.track('product_view')
  menu.isProductModalOpen = false
  store.closeDetail()
  resolve(enabled)
  await flush()
  expect(transport.ym.mock.calls.filter(([, , goal]) => goal === 'delivest_product_view')).toHaveLength(0)
})
