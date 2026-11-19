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

it('subscribes to updates and polls the manifest when no watermark arrives', async () => {
  const scope = effectScope()
  scope.run(() => useStorefrontUpdates())
  await Promise.resolve()
  expect(getSocket).toHaveBeenCalledOnce()
  await vi.advanceTimersByTimeAsync(21_000)
  expect(loadManifest).toHaveBeenCalledOnce()
  scope.stop()
})

it('applies a socket revision to menu queries', async () => {
  const scope = effectScope()
  scope.run(() => useStorefrontUpdates())
  await Promise.resolve()
  const revision = channelOn.mock.calls.find(call => call[0] === 'revision')?.[1] as ((value: unknown) => void)
  expect(revision).toBeTypeOf('function')
  revision({ revisions: { menu: '2' }, valid_until: new Date(Date.now() + 60_000).toISOString() })
  expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['menu', pilot, 'ru'] })
  scope.stop()
})
