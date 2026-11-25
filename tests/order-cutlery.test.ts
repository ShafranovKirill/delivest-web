import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'

const createOrder = vi.fn()
const resetCutleryCount = vi.fn()
const franchise = reactive({ cutleryEnabled: true })
const cart = reactive({
  isEmpty: false,
  cutleryCount: 0,
  totalAmount: 150_000,
  cart: { id: 'cart-1', revision: 'revision-1' },
  resetCutleryCount,
  fetchCart: vi.fn().mockResolvedValue(undefined),
})

vi.mock('@/modules/order/api/order.service', () => ({ OrderService: { createOrder } }))
vi.mock('@/modules/branch/stores/branch.store', () => ({
  useBranchStore: () => ({ activeBranch: { id: 'branch-1' }, getBranchIdFromCookie: () => null }),
}))
vi.mock('@/modules/franchise/stores/franchise.store', () => ({
  useFranchiseStore: () => franchise,
}))
vi.mock('@/modules/cart/stores/cart.store', () => ({ useCartStore: () => cart }))
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => ({ sessionEpoch: 0 }) }))
vi.mock('@/modules/analytics/useMetrikaAnalytics', () => ({
  useMetrikaAnalytics: () => ({ flushIdentity: vi.fn().mockResolvedValue(undefined) }),
}))
vi.mock('@/api/client', () => ({ queryClient: { invalidateQueries: vi.fn() } }))
vi.mock('@/i18n', () => ({ t: (key: string) => key }))

const { useOrderStore } = await import('../src/modules/order/stores/order.store')
const form = {
  customer_name: 'Customer',
  customer_phone: '+79990000000',
  fulfillment_type: 'pickup' as const,
  payment_method: 'cash' as const,
  cash_given: null,
  spend_points: 0,
  comment: '',
  cook_by: null,
  address: null,
  call_operator_for_address: false,
}

beforeEach(() => {
  setActivePinia(createPinia())
  createOrder.mockReset().mockResolvedValue({ id: 'order-1' })
  resetCutleryCount.mockClear()
  cart.fetchCart.mockClear()
  franchise.cutleryEnabled = true
  cart.cutleryCount = 0
})

it('submits a manual zero and resets it only after successful order creation', async () => {
  await useOrderStore().createOrder(form)
  expect(createOrder.mock.calls[0]?.[0]).toMatchObject({ persons: 0, cart_id: 'cart-1' })
  expect(resetCutleryCount).toHaveBeenCalledOnce()
})

it('omits persons when the franchise disables cutlery', async () => {
  franchise.cutleryEnabled = false
  await useOrderStore().createOrder(form)
  expect(createOrder.mock.calls[0]?.[0]).not.toHaveProperty('persons')
})

it('keeps the manual selection if order submission fails', async () => {
  createOrder.mockRejectedValueOnce(new Error('failed'))
  await expect(useOrderStore().createOrder(form)).rejects.toThrow('failed')
  expect(resetCutleryCount).not.toHaveBeenCalled()
})
