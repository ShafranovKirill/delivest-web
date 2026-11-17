import { describe, expect, it, vi } from 'vitest'
import {
  advertisingIdentity, commerceDelta, createMetrikaRuntime, minorToRub, publicAnalyticsUrl,
  type AdvertisingConfig, type Ym,
} from '../src/modules/analytics/metrika'

const enabled: AdvertisingConfig = {
  enabled: true, counter_id: '12345', generation: 1, ecommerce: true, capture: true,
  collection_basis: 'admin_approved', feature_version: 'A'.repeat(43),
}
const productId = '11111111-1111-4111-8111-111111111111'
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() }
function fixture(load?: () => Promise<Ym>, menuVisible = () => false) {
  const ym = vi.fn()
  const options = {
    load: vi.fn(load ?? (() => Promise.resolve(ym))),
    location: () => ({ href: 'https://shop.test/center/product/pizza?phone=secret&yclid=123456789', origin: 'https://shop.test', search: '?yclid=123456789&campaign_id=7777777' }),
    referrer: () => 'https://shop.test/center/checkout/order/private-id?phone=secret',
    layer: vi.fn(), identify: vi.fn(), menuVisible,
  }
  return { ...options, ym, runtime: createMetrikaRuntime(options) }
}

describe('optional Metrika runtime', () => {
  it('disabled collection creates no SDK requests, identifiers, goals or ecommerce buffers', async () => {
    const f = fixture()
    f.runtime.configure({ ...enabled, enabled: false, capture: false, collection_basis: 'disabled' })
    f.runtime.track('cart_add')
    f.runtime.detail({ id: productId, price: 12345 })
    f.runtime.page()
    await flush()
    expect(f.load).not.toHaveBeenCalled()
    expect(f.ym).not.toHaveBeenCalled()
    expect(f.identify).not.toHaveBeenCalled()
    expect(f.layer.mock.calls.filter(([value]) => value !== null)).toEqual([])
  })

  it('malformed or unapproved config fails closed', async () => {
    const f = fixture()
    for (const config of [
      { ...enabled, enabled: 'true' }, { ...enabled, feature_version: '' }, { ...enabled, generation: Infinity },
      { ...enabled, collection_basis: 'disabled' }, { ...enabled, counter_id: '1;alert(1)' },
    ]) f.runtime.configure(config as AdvertisingConfig)
    await flush()
    expect(f.load).not.toHaveBeenCalled()
    expect(f.identify).not.toHaveBeenCalled()
  })

  it('sends only public URLs and explicitly disables automatic personal-page collection', async () => {
    const f = fixture()
    f.runtime.configure(enabled)
    await flush()
    expect(f.ym).toHaveBeenCalledWith('12345', 'init', expect.objectContaining({
      defer: true, webvisor: false, clickmap: false, trackLinks: false, sendTitle: false,
      url: 'https://shop.test/center/product/pizza', referrer: 'https://shop.test/center',
    }))
    expect(JSON.stringify(f.ym.mock.calls)).not.toContain('secret')
    expect(JSON.stringify(f.ym.mock.calls)).not.toContain('private-id')
    f.runtime.page()
    expect(f.ym.mock.calls.filter(([, method]) => method === 'hit')).toHaveLength(1)
    const callback = f.ym.mock.calls.find(([, method]) => method === 'getClientID')?.[2] as (id: string) => void
    callback('9007199254740993123')
    expect(f.identify).toHaveBeenCalledWith({ yclid: '123456789', campaign_id: '7777777', client_id: '9007199254740993123' }, 1, enabled.feature_version)
  })

  it('disable destroys the counter and blocks late identity callbacks and buffered actions', async () => {
    const f = fixture()
    f.runtime.configure(enabled)
    await flush()
    const callback = f.ym.mock.calls.find(([, method]) => method === 'getClientID')?.[2] as (id: string) => void
    f.identify.mockClear()
    f.runtime.configure({ ...enabled, enabled: false, capture: false, collection_basis: 'disabled', generation: 2 })
    callback('123')
    f.runtime.track('cart_add')
    expect(f.identify).not.toHaveBeenCalled()
    expect(f.ym).toHaveBeenCalledWith('12345', 'destruct')
    expect(f.ym.mock.calls.filter(([, method, goal]) => method === 'reachGoal' && goal !== 'delivest_visit')).toHaveLength(0)
  })

  it('a stale SDK load cannot initialize a previous generation after auth/branch reset', async () => {
    let resolve!: (value: Ym) => void
    const f = fixture(() => new Promise(done => { resolve = done }))
    f.runtime.configure(enabled)
    f.identify.mockClear()
    f.runtime.track('cart_add')
    f.runtime.reset()
    resolve(f.ym)
    await flush()
    expect(f.ym).not.toHaveBeenCalled()
    expect(f.identify).not.toHaveBeenCalled()
  })

  it('captures permitted click identifiers for server conversions without loading a disabled browser counter', async () => {
    const f = fixture()
    f.runtime.configure({ ...enabled, enabled: false, counter_id: null, ecommerce: false })
    await flush()
    expect(f.load).not.toHaveBeenCalled()
    expect(f.ym).not.toHaveBeenCalled()
    expect(f.identify).toHaveBeenCalledExactlyOnceWith({ yclid: '123456789', campaign_id: '7777777' }, 1, enabled.feature_version)
  })

  it('bounds queued actions and treats blocked SDK as optional', async () => {
    let resolve!: (value: Ym) => void
    const f = fixture(() => new Promise(done => { resolve = done }))
    f.runtime.configure(enabled)
    for (let index = 0; index < 100; index++) f.runtime.track('cart_add')
    resolve(f.ym)
    await flush()
    expect(f.ym.mock.calls.filter(([, method, goal]) => method === 'reachGoal' && goal === 'delivest_cart_add')).toHaveLength(20)
    const failed = fixture(() => Promise.reject(new Error('blocked')))
    failed.runtime.configure(enabled)
    await flush()
    expect(() => failed.runtime.track('checkout_start')).not.toThrow()
    expect(failed.ym).not.toHaveBeenCalled()
  })

  it('emits current visit and loaded menu once after delayed config and SDK, without disabled-event replay', async () => {
    let resolve!: (client: Ym) => void
    const f = fixture(() => new Promise(done => { resolve = done }), () => true)
    f.runtime.track('visit')
    f.runtime.track('menu_view')
    f.runtime.track('cart_add')
    expect(f.ym).not.toHaveBeenCalled()
    f.runtime.configure(enabled)
    f.runtime.track('visit')
    resolve(f.ym)
    await flush()
    f.runtime.track('visit')
    f.runtime.track('menu_view')
    f.runtime.configure(enabled)
    const goals = f.ym.mock.calls.filter(([, method]) => method === 'reachGoal').map(([, , goal]) => goal)
    expect(goals).toEqual(['delivest_visit', 'delivest_menu_view'])
  })

  it('does not invent a menu view when the current menu is still loading', async () => {
    const f = fixture(undefined, () => false)
    f.runtime.track('menu_view')
    f.runtime.configure(enabled)
    await flush()
    expect(f.ym.mock.calls.filter(([, method]) => method === 'reachGoal').map(([, , goal]) => goal)).toEqual(['delivest_visit'])
    f.runtime.track('menu_view')
    expect(f.ym.mock.calls.filter(([, method, goal]) => method === 'reachGoal' && goal === 'delivest_menu_view')).toHaveLength(1)
  })

  it('feature off/on with unchanged settings generation discards the previous feature-version queue', async () => {
    const pending: ((client: Ym) => void)[] = []
    const f = fixture(() => new Promise(done => { pending.push(done) }))
    f.runtime.configure(enabled)
    f.runtime.track('cart_add')
    f.runtime.configure({ ...enabled, feature_version: 'B'.repeat(43) })
    pending[0]!(f.ym)
    await flush()
    expect(f.ym).not.toHaveBeenCalled()
    pending[1]!(f.ym)
    await flush()
    expect(f.ym.mock.calls.filter(([, method]) => method === 'init')).toHaveLength(1)
    expect(f.ym.mock.calls.filter(([, method, goal]) => method === 'reachGoal' && goal === 'delivest_cart_add')).toHaveLength(0)
    expect(f.identify.mock.calls.at(-1)?.[2]).toBe('B'.repeat(43))
  })

  it('one actual detail per opening and no browser purchase or completed goal', async () => {
    const f = fixture()
    f.runtime.configure(enabled)
    await flush()
    f.runtime.detail({ id: productId, price: 12345 })
    f.runtime.detail({ id: productId, price: 12345 })
    f.runtime.track('purchase')
    f.runtime.track('order_completed')
    expect(f.layer.mock.calls.filter(([value]) => value !== null)).toHaveLength(1)
    expect(f.layer).toHaveBeenCalledWith({ ecommerce: { currencyCode: 'RUB', detail: { products: [{ id: productId, price: '123.45', quantity: 1 }] } } })
    f.runtime.closeDetail()
    f.runtime.detail({ id: productId, price: 12345 })
    expect(f.layer.mock.calls.filter(([value]) => value !== null)).toHaveLength(2)
    expect(f.ym.mock.calls.filter(([, method, goal]) => method === 'reachGoal' && goal !== 'delivest_visit')).toHaveLength(0)
  })
})

it('cart removal 2 to 1 reports one confirmed unit and does not report price-only changes', () => {
  const line = { key: 'line', product_id: productId, quantity: 2, total_price: 24690 }
  expect(commerceDelta([line], [{ ...line, quantity: 1, total_price: 12345 }])).toEqual([
    { action: 'remove', products: [{ id: productId, price: '123.45', quantity: 1 }] },
  ])
  expect(commerceDelta([line], [{ ...line, total_price: 20000 }])).toEqual([])
  expect(commerceDelta([], [{ ...line, gift: true }])).toEqual([])
  expect(commerceDelta([], [line])).toEqual([
    { action: 'add', products: [{ id: productId, price: '123.45', quantity: 2 }] },
  ])
})

it('scrubs attribution fields and private routes without floating-point minor conversion', () => {
  expect(advertisingIdentity('?yclid=123&campaign_id=12345678&ad_id=phone&phone=secret')).toEqual({ yclid: '123', campaign_id: '12345678' })
  expect(publicAnalyticsUrl('https://other.test/center', 'https://shop.test')).toBeNull()
  expect(publicAnalyticsUrl('/center/addresses?phone=secret', 'https://shop.test')).toBe('https://shop.test/center')
  expect(minorToRub(1)).toBe('0.01')
  expect(() => minorToRub(1.1)).toThrow()
})
