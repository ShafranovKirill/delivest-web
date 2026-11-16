import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const getCart = vi.fn()
const addItem = vi.fn()
const track = vi.fn()
vi.mock('@/modules/cart/api/cart.service', () => ({ CartService: { getCart, addItem } }))
vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => ({ activeBranch: { id: 'branch' } }) }))
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => ({ sessionEpoch: 1 }) }))
vi.mock('@/api/errors', () => ({ getApiErrorCode: () => null }))
vi.mock('@/modules/analytics/useFunnelAnalytics', () => ({ useFunnelAnalytics: () => ({ track }) }))
const { useCartStore } = await import('../src/modules/cart/stores/cart.store')
const cart = { id: 'cart', items: [], total_quantity: 0, total_amount: 0 }

beforeEach(() => {
  setActivePinia(createPinia())
  getCart.mockReset().mockResolvedValue(cart)
  addItem.mockReset()
  track.mockReset()
})

it('records cart_add only after a successful user add', async () => {
  addItem.mockResolvedValueOnce(cart).mockRejectedValueOnce(new Error('failed'))
  const store = useCartStore()
  await store.addItem('product')
  expect(track).toHaveBeenCalledExactlyOnceWith('cart_add')
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  await expect(store.addItem('product')).rejects.toThrow('failed')
  expect(track).toHaveBeenCalledTimes(1)
  log.mockRestore()
})
