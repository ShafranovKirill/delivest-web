import { describe, expect, it, vi } from 'vitest'
import {
  createTopMailRuntime,
  topMailPublicUrl,
  topMailReferrer,
  type TopMailConfig,
} from '../src/modules/analytics/topMail'

const enabled: TopMailConfig = { enabled: true, counter_id: '3817108' }
const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

function fixture(loader: () => Promise<void> = () => Promise.resolve()) {
  let href = 'https://shop.test/center?phone=secret'
  let referrer = 'https://search.test/landing?click_id=private#fragment'
  const load = vi.fn(loader)
  const push = vi.fn()
  const runtime = createTopMailRuntime({
    load,
    push,
    location: () => ({ href, origin: 'https://shop.test' }),
    referrer: () => referrer,
  })
  return {
    runtime,
    load,
    push,
    navigate: (next: string) => {
      href = next
      runtime.page()
    },
    setReferrer: (next: string) => {
      referrer = next
    },
  }
}

describe('Top.Mail.Ru public page tracking', () => {
  it('accepts only the selected branch public paths and removes private URL data', () => {
    expect(
      topMailPublicUrl(
        'https://shop.test/center/product/pizza?phone=secret#x',
        'https://shop.test',
        'center',
      ),
    ).toBe('https://shop.test/center/product/pizza')
    expect(
      topMailPublicUrl('https://shop.test/center/category/sushi', 'https://shop.test', 'center'),
    ).toBe('https://shop.test/center/category/sushi')
    for (const path of [
      'promotions',
      'branch-info',
      'contacts',
      'legal/offer',
      'legal/terms',
      'legal/privacy',
      'legal/consent',
    ]) {
      expect(
        topMailPublicUrl(
          `https://shop.test/center/${path}?phone=secret#section`,
          'https://shop.test',
          'center',
        ),
      ).toBe(`https://shop.test/center/${path}`)
    }
    for (const url of [
      'https://shop.test/other',
      'https://shop.test/center/checkout/order/123',
      'https://shop.test/center/account',
      'https://shop.test/center/orders',
      'https://shop.test/center/stars',
      'https://shop.test/center/addresses',
      'https://shop.test/center/notification-channels',
      'https://shop.test/center/legal/account',
      'https://shop.test/center/legal/privacy/extra',
      'https://shop.test/select-branch',
      'https://elsewhere.test/center',
    ])
      expect(topMailPublicUrl(url, 'https://shop.test', 'center')).toBeNull()
    expect(topMailReferrer('https://ads.test/path?secret=1', 'https://shop.test', 'center')).toBe(
      'https://ads.test',
    )
    expect(
      topMailReferrer('https://shop.test/center/account?secret=1', 'https://shop.test', 'center'),
    ).toBe('')
  })

  it('sends one initial view and one per public route transition without query/hash duplicates', async () => {
    const f = fixture()
    f.runtime.configure('branch-1', 'center', enabled)
    f.runtime.page()
    f.runtime.page()
    f.navigate('https://shop.test/center?utm_source=vk#menu')
    f.navigate('https://shop.test/center/product/pizza?phone=private')
    f.navigate('https://shop.test/center/product/pizza#reviews')
    await flush()
    expect(f.push.mock.calls).toEqual([
      [
        {
          id: '3817108',
          type: 'pageView',
          url: 'https://shop.test/center',
          referrer: 'https://search.test',
        },
      ],
      [
        {
          id: '3817108',
          type: 'pageView',
          url: 'https://shop.test/center/product/pizza',
          referrer: 'https://shop.test/center',
        },
      ],
    ])
    expect(JSON.stringify(f.push.mock.calls)).not.toContain('private')
    expect(f.load).toHaveBeenCalledTimes(2)
  })

  it('tracks a return to the same public page after a private route', async () => {
    const f = fixture()
    f.runtime.configure('branch-1', 'center', enabled)
    f.runtime.page()
    f.navigate('https://shop.test/center/checkout?address=private')
    f.navigate('https://shop.test/center')
    await flush()
    expect(f.push).toHaveBeenCalledTimes(2)
    expect(JSON.stringify(f.push.mock.calls)).not.toContain('address')
  })

  it('never loads for disabled or malformed configuration and isolates branches', async () => {
    const f = fixture()
    f.runtime.configure('branch-1', 'center', { enabled: false, counter_id: '3817108' })
    f.runtime.page()
    f.runtime.configure('branch-1', 'center', { enabled: true, counter_id: '3;1' })
    f.runtime.page()
    f.runtime.configure('branch-1', 'center', { enabled: true, counter_id: '0' })
    f.runtime.page()
    f.runtime.configure('branch-1', 'center', enabled)
    f.navigate('https://shop.test/other')
    await flush()
    expect(f.load).not.toHaveBeenCalled()
    f.runtime.configure('branch-2', 'other', { enabled: true, counter_id: '900' })
    f.runtime.page()
    await flush()
    expect(f.push).toHaveBeenCalledOnce()
    expect(f.push.mock.calls[0]?.[0]).toMatchObject({ id: '900', url: 'https://shop.test/other' })
  })

  it('drops a page awaiting the SDK when the branch changes or collection is disabled', async () => {
    const pending: Array<() => void> = []
    const f = fixture(
      () =>
        new Promise((resolve) => {
          pending.push(resolve)
        }),
    )
    f.runtime.configure('branch-1', 'center', enabled)
    f.runtime.page()
    f.runtime.configure('branch-2', 'other', { enabled: true, counter_id: '900' })
    f.navigate('https://shop.test/other')
    pending[0]!()
    await flush()
    expect(f.push).not.toHaveBeenCalled()
    f.runtime.configure('branch-2', 'other', { enabled: false, counter_id: '900' })
    pending[1]!()
    await flush()
    expect(f.push).not.toHaveBeenCalled()
  })

  it('an SDK error does not throw and allows a later retry', async () => {
    const f = fixture(() => Promise.reject(new Error('blocked')))
    f.runtime.configure('branch-1', 'center', enabled)
    f.runtime.page()
    await flush()
    expect(f.push).not.toHaveBeenCalled()
    f.runtime.page()
    expect(f.load).toHaveBeenCalledTimes(2)
  })

  it('inserts the SDK once, including after module reload', async () => {
    const appended: Array<{
      tagName: string
      dataset: Record<string, string>
      onload?: () => void
    }> = []
    const document = {
      getElementById: () => appended[0] ?? null,
      createElement: () => ({ tagName: 'SCRIPT', dataset: {}, remove: vi.fn() }),
      head: {
        appendChild: (script: (typeof appended)[number]) => {
          expect((window as typeof window & { _tmr?: unknown[] })._tmr).toEqual([])
          appended.push(script)
        },
      },
    }
    vi.stubGlobal('document', document)
    vi.stubGlobal('window', {})
    try {
      vi.resetModules()
      const first = await import('../src/modules/analytics/topMail')
      const one = first.loadTopMailSdk()
      const two = first.loadTopMailSdk()
      expect(appended).toHaveLength(1)
      appended[0]!.onload?.()
      await Promise.all([one, two])
      vi.resetModules()
      const reloaded = await import('../src/modules/analytics/topMail')
      await reloaded.loadTopMailSdk()
      expect(appended).toHaveLength(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
