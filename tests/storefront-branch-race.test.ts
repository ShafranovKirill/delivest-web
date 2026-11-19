import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { loadStorefront, locale, getBranches, selectBySlug, selectById, clearActive, primeSession } = vi.hoisted(() => ({
  loadStorefront: vi.fn(), locale: { value: 'ru' }, getBranches: vi.fn(),
  selectBySlug: vi.fn(), selectById: vi.fn(), clearActive: vi.fn(), primeSession: vi.fn(),
}))
vi.mock('@/api/storefront', () => ({
  loadStorefront,
  rememberMenuValidity: vi.fn(), rememberWatermark: vi.fn(), seedAdvertisingConfig: vi.fn(),
}))
vi.mock('@/api/client', () => ({ queryClient: { setQueryData: vi.fn() } }))
vi.mock('@/router/primeSession', () => ({ primeSession }))
vi.mock('@/i18n', () => ({ currentLocale: () => locale.value }))
vi.mock('@/modules/franchise/stores/franchise.store', () => ({
  useFranchiseStore: () => ({ setFranchise: vi.fn() }),
}))
vi.mock('@/modules/branch/composables/useBranchSchedule', () => ({ useBranchSchedule: () => ({}) }))
vi.mock('@/modules/branch/api/branch.service', () => ({ BranchService: {
  getBranches, selectBranchBySlug: selectBySlug, selectBranch: selectById, clearActive,
} }))

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

const pilot = { id: '11111111-1111-4111-8111-111111111111', slug: 'pilot', name: 'Pilot', is_active: true }
const legacy = { id: '22222222-2222-4222-8222-222222222222', slug: 'legacy', name: 'Legacy', is_active: true }

beforeEach(() => {
  setActivePinia(createPinia()); loadStorefront.mockReset(); locale.value = 'ru'
  getBranches.mockReset().mockResolvedValue([pilot, legacy])
  selectBySlug.mockReset().mockImplementation(async slug => slug === 'legacy' ? legacy : pilot)
  selectById.mockReset().mockImplementation(async id => id === legacy.id ? legacy : pilot)
  clearActive.mockReset().mockResolvedValue({ message: 'ok' })
  primeSession.mockReset()
})
afterEach(() => vi.unstubAllGlobals())

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

it('uses a saved branch on root and bootstraps another direct slug', async () => {
  vi.stubGlobal('localStorage', { getItem: () => pilot.id, setItem: vi.fn() })
  loadStorefront.mockResolvedValueOnce(payload(pilot.slug)).mockResolvedValueOnce(payload(legacy.slug))
  const store = useBranchStore()
  await store.initBranches()
  expect(loadStorefront).toHaveBeenCalledWith(undefined, pilot.id)
  await store.selectBranchBySlug(legacy.slug)
  expect(loadStorefront).toHaveBeenCalledWith(legacy.slug, undefined)
  expect(selectBySlug).not.toHaveBeenCalled()
})

it('does not restore a pending branch after clearing the active branch', async () => {
  const store = useBranchStore()
  const pending = deferred()
  loadStorefront.mockReturnValue(pending.promise)
  const first = store.loadBootstrap('pilot').catch(() => null)
  await store.clearActiveBranch()
  expect(primeSession).toHaveBeenCalled()
  pending.resolve(payload('pilot'))
  await first
  expect(store.activeBranch).toBeNull()
})
