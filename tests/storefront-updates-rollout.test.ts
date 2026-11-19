import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

const pilot = '11111111-1111-4111-8111-111111111111'
const { branch, auth, getSocket, loadManifest, invalidateQueries, channelOn } = vi.hoisted(() => ({
  branch: { activeBranch: { id: '11111111-1111-4111-8111-111111111111' }, refreshBranches: vi.fn() },
  auth: { sessionEpoch: 1 },
  getSocket: vi.fn(), loadManifest: vi.fn(), invalidateQueries: vi.fn(), channelOn: vi.fn(),
}))

vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/franchise/stores/franchise.store', () => ({ useFranchiseStore: () => ({ init: vi.fn() }) }))
vi.mock('@/modules/analytics/useMetrikaAnalytics', () => ({ useMetrikaAnalytics: () => ({
  disable: vi.fn(), applyConfig: vi.fn(), revalidate: vi.fn(), confirmWatermark: vi.fn(),
}) }))
vi.mock('@/api/client', () => ({ queryClient: { invalidateQueries, getQueryData: vi.fn() } }))
vi.mock('@/api/socket', () => ({ getSocket }))
vi.mock('@/i18n', () => ({ currentLocale: () => 'ru' }))
vi.mock('@/api/storefront', () => ({
  invalidateMenuValidity: vi.fn(), renewMenuValidity: vi.fn(),
  loadManifest, previousWatermark: vi.fn(), rememberWatermark: vi.fn(),
}))

const { useStorefrontUpdates } = await import('@/modules/branch/composables/useStorefrontUpdates')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-20T00:00:00Z'))
  branch.activeBranch.id = pilot
  getSocket.mockReset()
  loadManifest.mockReset().mockResolvedValue({
    revisions: { menu: '2' }, valid_until: new Date(Date.now() + 60_000).toISOString(),
  })
  invalidateQueries.mockReset()
  channelOn.mockReset()
  const channel = { on: channelOn, join: () => ({ receive: vi.fn() }), leave: vi.fn() }
  getSocket.mockResolvedValue({ channel: () => channel })
  vi.stubGlobal('document', { visibilityState: 'visible', addEventListener: vi.fn(), removeEventListener: vi.fn() })
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

async function run(flags: Record<string, string>) {
  vi.stubGlobal('window', { _env: flags })
  const scope = effectScope()
  scope.run(() => useStorefrontUpdates())
  await Promise.resolve()
  const subscribed = getSocket.mock.calls.length
  await vi.advanceTimersByTimeAsync(21_000)
  const polled = loadManifest.mock.calls.length
  scope.stop()
  return { subscribed, polled }
}

it('keeps manifest polling with reads on and updates off', async () => {
  expect(await run({ VITE_STOREFRONT_UPDATES: 'false' })).toEqual({ subscribed: 0, polled: 1 })
})

it('subscribes and polls with reads off and updates explicitly on', async () => {
  expect(await run({ VITE_STOREFRONT_BOOTSTRAP: 'false', VITE_STOREFRONT_UPDATES: 'true' }))
    .toEqual({ subscribed: 1, polled: 1 })
})

it('applies an update to legacy menu queries when reads are off', async () => {
  vi.stubGlobal('window', { _env: { VITE_STOREFRONT_BOOTSTRAP: 'false', VITE_STOREFRONT_UPDATES: 'true' } })
  const scope = effectScope()
  scope.run(() => useStorefrontUpdates())
  await Promise.resolve()
  const revision = channelOn.mock.calls.find(call => call[0] === 'revision')?.[1] as ((value: unknown) => void)
  expect(revision).toBeTypeOf('function')
  revision({ revisions: { menu: '2' }, valid_until: new Date(Date.now() + 60_000).toISOString() })
  expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['menu', pilot, 'ru'] })
  scope.stop()
})

it('does no storefront metadata work when both are off, including legacy default', async () => {
  expect(await run({ VITE_STOREFRONT_BOOTSTRAP: 'false' })).toEqual({ subscribed: 0, polled: 0 })
})
