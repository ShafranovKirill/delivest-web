import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchCart = vi.fn().mockResolvedValue(undefined)
const resetCutleryCount = vi.fn()
const createOrder = vi.fn()
const invalidateQueries = vi.fn()
const cart = {
  isEmpty: false,
  cart: { id: 'cart-a', revision: 'rev-a' },
  totalAmount: 59000,
  cutleryCount: 0,
  fetchCart,
  resetCutleryCount,
}

vi.mock('@/modules/branch/stores/branch.store', () => ({
  useBranchStore: () => ({ activeBranch: { id: 'branch-a' }, getBranchIdFromCookie: () => null }),
}))
vi.mock('@/modules/franchise/stores/franchise.store', () => ({
  useFranchiseStore: () => ({ cutleryEnabled: false }),
}))
vi.mock('@/modules/cart/stores/cart.store', () => ({ useCartStore: () => cart }))
vi.mock('@/modules/auth/stores/auth.store', () => ({
  useAuthStore: () => ({ sessionEpoch: 1, isAuthenticated: true, openModal: vi.fn() }),
}))
vi.mock('@/modules/analytics/useMetrikaAnalytics', () => ({
  useMetrikaAnalytics: () => ({ flushIdentity: vi.fn().mockResolvedValue(undefined) }),
}))
vi.mock('@/modules/order/api/order.service', () => ({ OrderService: { createOrder } }))
vi.mock('@/api/client', () => ({ queryClient: { invalidateQueries } }))
vi.mock('@/i18n', () => ({ t: (key: string) => key }))

const { useOrderStore } = await import('@/modules/order/stores/order.store')

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  createOrder.mockResolvedValue({ id: 'order-a', awaiting_payment: true, branch_id: 'branch-a' })
})

describe('pending order cart lifecycle', () => {
  it('refreshes the consumed cart immediately while the payment is pending', async () => {
    const store = useOrderStore()
    const result = await store.createOrder({
      customer_name: 'Customer',
      customer_phone: '+79990001122',
      fulfillment_type: 'pickup',
      payment_method: 'online',
      cash_given: null,
      spend_points: 0,
      comment: '',
      cook_by: null,
      address: null,
      call_operator_for_address: false,
    })
    expect(result).toMatchObject({ id: 'order-a', awaiting_payment: true })
    expect(resetCutleryCount).toHaveBeenCalledOnce()
    expect(fetchCart).toHaveBeenCalledWith('branch-a', true)
  })
})
