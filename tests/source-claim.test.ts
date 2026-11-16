import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { createPinia, disposePinia, setActivePinia } from 'pinia'

const auth = reactive({
  client: null as { id: string } | null,
  accessToken: null as string | null,
  sessionEpoch: 0,
  isAuthenticated: false,
})
const branch = reactive({
  activeBranch: null as { id: string; branch_info: { analytics_links_enabled: boolean } } | null,
})
const claim = vi.hoisted(() => vi.fn())
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('../src/modules/analytics/sourceClaim.service', () => ({ SourceClaimService: { claim } }))
import { useSourceClaim } from '../src/modules/analytics/useSourceClaim'

let pinia: ReturnType<typeof createPinia>

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  auth.client = null
  auth.accessToken = null
  auth.sessionEpoch = 0
  auth.isAuthenticated = false
  branch.activeBranch = { id: 'branch-a', branch_info: { analytics_links_enabled: true } }
  claim.mockReset().mockResolvedValue(undefined)
})

afterEach(() => disposePinia(pinia))

it('does not send when capability is off, then claims once when it becomes available', async () => {
  branch.activeBranch!.branch_info.analytics_links_enabled = false
  useSourceClaim()
  auth.sessionEpoch = 1
  auth.client = { id: 'verified' }
  auth.accessToken = 'token'
  auth.isAuthenticated = true
  await nextTick()
  expect(claim).not.toHaveBeenCalled()

  branch.activeBranch!.branch_info.analytics_links_enabled = true
  await nextTick()
  expect(claim).toHaveBeenCalledTimes(1)
  expect(claim.mock.calls[0]?.[0]).toBe('token')
  expect(claim.mock.calls[0]?.length).toBe(2)
  auth.accessToken = 'refreshed'
  await nextTick()
  expect(claim).toHaveBeenCalledTimes(1)
})

it('waits for access token after profile restoration', async () => {
  useSourceClaim()
  auth.client = { id: 'verified' }
  auth.isAuthenticated = true
  await nextTick()
  expect(claim).not.toHaveBeenCalled()
  auth.accessToken = 'restored-token'
  await nextTick()
  expect(claim).toHaveBeenCalledTimes(1)
})

it('claim failure never changes authentication and a new login retries', async () => {
  claim.mockRejectedValue(new Error('offline'))
  useSourceClaim()
  auth.sessionEpoch = 1
  auth.accessToken = 'token'
  auth.client = { id: 'verified' }
  auth.isAuthenticated = true
  await nextTick()
  await Promise.resolve()
  expect(auth.client?.id).toBe('verified')
  auth.sessionEpoch = 2
  await nextTick()
  expect(claim).toHaveBeenCalledTimes(2)
})

it('aborts a pending request when branch, identity, or capability changes', async () => {
  claim.mockImplementation(() => new Promise(() => {}))
  useSourceClaim()
  auth.sessionEpoch = 1
  auth.accessToken = 'token'
  auth.client = { id: 'verified' }
  auth.isAuthenticated = true
  await nextTick()
  const firstSignal = claim.mock.calls[0]?.[1] as AbortSignal
  expect(firstSignal.aborted).toBe(false)

  branch.activeBranch = { id: 'branch-b', branch_info: { analytics_links_enabled: true } }
  await nextTick()
  expect(firstSignal.aborted).toBe(true)
  const secondSignal = claim.mock.calls[1]?.[1] as AbortSignal
  auth.client = { id: 'other' }
  await nextTick()
  expect(secondSignal.aborted).toBe(true)
  const thirdSignal = claim.mock.calls[2]?.[1] as AbortSignal
  branch.activeBranch.branch_info.analytics_links_enabled = false
  await nextTick()
  expect(thirdSignal.aborted).toBe(true)
  expect(claim).toHaveBeenCalledTimes(3)

  branch.activeBranch.branch_info.analytics_links_enabled = true
  await nextTick()
  expect(claim).toHaveBeenCalledTimes(4)
})
