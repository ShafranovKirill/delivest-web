import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { loadStorefront, locale } = vi.hoisted(() => ({
  loadStorefront: vi.fn(), locale: { value: 'ru' },
}))
vi.mock('@/api/storefront', () => ({
  loadStorefront, bootstrapEnabled: true,
  rememberMenuValidity: vi.fn(), rememberWatermark: vi.fn(), seedAdvertisingConfig: vi.fn(),
}))
vi.mock('@/api/client', () => ({ queryClient: { setQueryData: vi.fn() } }))
vi.mock('@/router/primeSession', () => ({ primeSession: vi.fn() }))
vi.mock('@/i18n', () => ({ currentLocale: () => locale.value }))
vi.mock('@/modules/franchise/stores/franchise.store', () => ({
  useFranchiseStore: () => ({ setFranchise: vi.fn() }),
}))
vi.mock('@/modules/branch/composables/useBranchSchedule', () => ({ useBranchSchedule: () => ({}) }))
vi.mock('@/modules/branch/api/branch.service', () => ({ BranchService: {} }))

const { useBranchStore } = await import('@/modules/branch/stores/branch.store')

function deferred() {
  let resolve!: (value: unknown) => void
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}
function payload(slug: string, lang = 'ru') {
  const branch = { id: slug, slug, name: slug, is_active: true }
  return { schema_version: 1, locale: lang, revisions: {}, valid_until: new Date(Date.now() + 10000).toISOString(),
    franchise: {}, branches: [branch], selected_branch: branch, menu: [], stories: [], advertising: null }
}

beforeEach(() => { setActivePinia(createPinia()); loadStorefront.mockReset(); locale.value = 'ru' })

it('ignores a branch A response that arrives after B', async () => {
  const a = deferred(), b = deferred()
  loadStorefront.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise)
  const store = useBranchStore()
  const first = store.selectBranchBySlug('a').catch(() => null)
  const second = store.selectBranchBySlug('b')
  b.resolve(payload('b'))
  await second
  a.resolve(payload('a'))
  await first
  expect(store.activeBranch?.slug).toBe('b')
  expect(store.branches[0]?.slug).toBe('b')
})

it('does not commit a response for the previous locale', async () => {
  const pending = deferred()
  loadStorefront.mockReturnValueOnce(pending.promise)
  const store = useBranchStore()
  const request = store.loadBootstrap('a')
  locale.value = 'en'
  pending.resolve(payload('a', 'ru'))
  await expect(request).rejects.toThrow('Superseded storefront response')
  expect(store.activeBranch).toBeNull()
})
