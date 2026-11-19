import { beforeEach, expect, it, vi } from 'vitest'

const { loadPrivateSession, cart, auth, branch, querySet, queryFetch, tokenSeed } = vi.hoisted(() => ({
  loadPrivateSession: vi.fn(),
  cart: { revision: 0, isInitialized: false, setSessionCart: vi.fn(), fetchCart: vi.fn() },
  auth: { sessionEpoch: 1, client: null as null | { id: string }, accessToken: null as null | string, sessionChanging: false },
  branch: { activeBranch: { id: 'branch-a' } },
  querySet: vi.fn(), queryFetch: vi.fn(), tokenSeed: vi.fn(),
}))
vi.mock('@/api/storefront', () => ({ loadPrivateSession }))
vi.mock('@/api/socket', () => ({ seedSocketToken: tokenSeed }))
vi.mock('@/api/client', () => ({ queryClient: { setQueryData: querySet, fetchQuery: queryFetch } }))
vi.mock('@/modules/order/api/order.service', () => ({ OrderService: { getActiveOrders: vi.fn() } }))
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('@/modules/cart/stores/cart.store', () => ({ useCartStore: () => cart }))

const { primeSession } = await import('@/router/primeSession')

function deferred() {
  let resolve!: (value: unknown) => void
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}

beforeEach(() => {
  loadPrivateSession.mockReset(); cart.setSessionCart.mockReset(); querySet.mockReset(); queryFetch.mockReset().mockResolvedValue([]); tokenSeed.mockReset()
  cart.revision = 0; auth.sessionEpoch++; auth.client = null; auth.accessToken = null; auth.sessionChanging = false; branch.activeBranch.id = 'branch-a'
  cart.isInitialized = false; cart.fetchCart.mockReset().mockResolvedValue(undefined)
})

it('does not replace a cart changed while the session request was in flight', async () => {
  const pending = deferred()
  loadPrivateSession.mockReturnValueOnce(pending.promise)
  primeSession()
  cart.revision++
  pending.resolve({ cart: null, active_orders: [], socket_token: 'token' })
  await pending.promise
  await Promise.resolve()
  expect(cart.setSessionCart).not.toHaveBeenCalled()
  expect(querySet).toHaveBeenCalledOnce()
})

it('does not issue another private request on same-branch route navigation', async () => {
  const pending = deferred()
  loadPrivateSession.mockReturnValueOnce(pending.promise)
  primeSession()
  primeSession()
  expect(loadPrivateSession).toHaveBeenCalledOnce()
  pending.resolve({ cart: null, active_orders: [], socket_token: 'token' })
  await pending.promise
})

it('does not seed a session after identity changes', async () => {
  const pending = deferred()
  loadPrivateSession.mockReturnValueOnce(pending.promise)
  primeSession()
  auth.sessionEpoch++
  pending.resolve({ cart: null, active_orders: [], socket_token: 'token' })
  await pending.promise
  await Promise.resolve()
  expect(cart.setSessionCart).not.toHaveBeenCalled()
  expect(querySet).not.toHaveBeenCalled()
  expect(tokenSeed).not.toHaveBeenCalled()
})

it('recovers the existing cart endpoint once after private bootstrap fails', async () => {
  const pending = deferred()
  loadPrivateSession.mockReturnValueOnce(pending.promise)
  primeSession()
  pending.resolve(Promise.reject(new Error('offline')))
  await pending.promise.catch(() => undefined)
  await Promise.resolve()
  expect(cart.fetchCart).toHaveBeenCalledOnce()
  expect(cart.fetchCart).toHaveBeenCalledWith('branch-a')
})

it('waits for an identity transition and seeds only the settled client', async () => {
  const pending = deferred()
  auth.client = { id: 'old' }; auth.accessToken = 'old-token'; auth.sessionChanging = true
  auth.sessionEpoch++
  primeSession()
  expect(loadPrivateSession).not.toHaveBeenCalled()
  auth.client = { id: 'new' }; auth.accessToken = 'new-token'; auth.sessionChanging = false
  loadPrivateSession.mockReturnValueOnce(pending.promise)
  primeSession()
  expect(loadPrivateSession).toHaveBeenCalledOnce()
  pending.resolve({ cart: null, active_orders: [], socket_token: 'new-socket' })
  await pending.promise
  await Promise.resolve()
  expect(querySet).toHaveBeenCalledOnce()
  expect(querySet.mock.calls[0]![0]).toContain('new')
  expect(tokenSeed).toHaveBeenCalledWith('new-socket', auth.sessionEpoch)
})
