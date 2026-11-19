import { expect, it, vi } from 'vitest'

const { publicGet, privateGet, locale } = vi.hoisted(() => ({
  publicGet: vi.fn(), privateGet: vi.fn(), locale: { value: 'ru' },
}))
vi.mock('@/api/client', () => ({ api: { get: privateGet }, queryClient: { setQueryData: vi.fn() } }))
vi.mock('@/utils/env', () => ({ getApiBaseUrl: () => 'http://localhost:4000' }))
vi.mock('@/i18n', () => ({ currentLocale: () => locale.value }))

const { loadStorefront, loadPrivateSession, pendingPrivateSession } = await import('@/api/storefront')
vi.stubGlobal('fetch', publicGet)

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

it('shares one public request and cancels a superseded branch without credentials', async () => {
  const first = deferred<{ ok: boolean; json: () => Promise<{ schema_version: number; locale: string }> }>()
  const second = deferred<{ ok: boolean; json: () => Promise<{ schema_version: number; locale: string }> }>()
  publicGet.mockReset().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
  const a = loadStorefront('branch-a')
  expect(loadStorefront('branch-a')).toBe(a)
  expect(publicGet).toHaveBeenCalledTimes(1)
  const signal = publicGet.mock.calls[0]![1].signal as AbortSignal
  const b = loadStorefront('branch-b')
  expect(signal.aborted).toBe(true)
  expect(publicGet.mock.calls[0]![1].credentials).toBe('omit')
  expect(publicGet.mock.calls[0]![0].href).toContain('http://localhost:4000/client/storefront/v1/bootstrap')
  first.resolve({ ok: true, json: async () => ({ schema_version: 1, locale: 'ru' }) })
  second.resolve({ ok: true, json: async () => ({ schema_version: 1, locale: 'ru' }) })
  await Promise.all([a, b])
})

it('shares one private request per branch and epoch', async () => {
  const request = deferred<{ data: { cart: null; active_orders: []; socket_token: string } }>()
  privateGet.mockReset().mockReturnValueOnce(request.promise)
  const a = loadPrivateSession('branch-id', 7)
  expect(loadPrivateSession('branch-id', 7)).toBe(a)
  expect(pendingPrivateSession('branch-id', 7)).toBe(a)
  await vi.waitFor(() => expect(privateGet).toHaveBeenCalledTimes(1))
  expect(privateGet.mock.calls[0]![1].params.branch_id).toBe('branch-id')
  request.resolve({ data: { cart: null, active_orders: [], socket_token: 'token' } })
  expect((await a).cart).toBeNull()
})

it('sends a saved branch preference on the root public bootstrap', async () => {
  publicGet.mockReset().mockResolvedValue({ ok: true, json: async () => ({ schema_version: 1, locale: 'ru' }) })
  await loadStorefront(undefined, 'saved-branch')
  const url = publicGet.mock.calls[0]![0] as URL
  expect(url.searchParams.get('branch_id')).toBe('saved-branch')
  expect(url.searchParams.get('slug')).toBeNull()
  expect(publicGet.mock.calls[0]![1].credentials).toBe('omit')
})
