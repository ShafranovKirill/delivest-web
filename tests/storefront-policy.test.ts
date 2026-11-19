import { afterEach, expect, it, vi } from 'vitest'
import { funnelBatchingEnabled, storefrontReadsEnabled, storefrontUpdatesEnabled } from '@/api/storefrontPolicy'

const pilot = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

it('preserves defaults and the legacy bootstrap-off implication for absent updates', () => {
  vi.stubGlobal('window', { _env: {} })
  expect(storefrontReadsEnabled()).toBe(true)
  expect(storefrontUpdatesEnabled()).toBe(true)
  expect(funnelBatchingEnabled()).toBe(true)

  vi.stubEnv('VITE_STOREFRONT_BOOTSTRAP', 'false')
  expect(storefrontReadsEnabled(pilot)).toBe(false)
  expect(storefrontUpdatesEnabled(pilot)).toBe(false)
  expect(funnelBatchingEnabled(pilot)).toBe(true)
  window._env = { VITE_STOREFRONT_UPDATES: 'true' }
  expect(storefrontUpdatesEnabled(pilot)).toBe(true)
})

it('uses runtime values over build values and ignores empty runtime overrides', () => {
  vi.stubEnv('VITE_STOREFRONT_BOOTSTRAP', 'false')
  vi.stubGlobal('window', { _env: { VITE_STOREFRONT_BOOTSTRAP: '' } })
  expect(storefrontReadsEnabled(pilot)).toBe(false)
  window._env = { VITE_STOREFRONT_BOOTSTRAP: 'true' }
  expect(storefrontReadsEnabled(pilot)).toBe(true)
  window._env = { VITE_STOREFRONT_BOOTSTRAP: 'garbage' }
  expect(storefrontReadsEnabled(pilot)).toBe(false)
})

it('allows only valid UUIDs in independent branch lists', () => {
  vi.stubGlobal('window', { _env: {
    VITE_STOREFRONT_BOOTSTRAP_BRANCH_IDS: pilot,
    VITE_STOREFRONT_UPDATES_BRANCH_IDS: other,
    VITE_FUNNEL_BATCHING_BRANCH_IDS: pilot,
  } })
  expect(storefrontReadsEnabled()).toBe(false)
  expect(storefrontReadsEnabled(pilot)).toBe(true)
  expect(storefrontReadsEnabled(other)).toBe(false)
  expect(storefrontUpdatesEnabled(other)).toBe(true)
  expect(storefrontUpdatesEnabled(pilot)).toBe(false)
  expect(funnelBatchingEnabled(pilot)).toBe(true)
  expect(funnelBatchingEnabled(other)).toBe(false)

  window._env!.VITE_STOREFRONT_BOOTSTRAP_BRANCH_IDS = `${pilot},not-a-uuid`
  expect(storefrontReadsEnabled(pilot)).toBe(false)
  window._env!.VITE_STOREFRONT_BOOTSTRAP = 'false'
  window._env!.VITE_STOREFRONT_BOOTSTRAP_BRANCH_IDS = pilot
  expect(storefrontReadsEnabled(pilot)).toBe(false)
})
