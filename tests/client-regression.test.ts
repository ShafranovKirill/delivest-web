import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { reactive, nextTick, effectScope, ref } from 'vue'
import { emptyDeliveryAddress } from '@/modules/fulfillment/utils/deliveryAddress'

function memoryStorage(): Storage {
  const entries = new Map<string, string>()
  return {
    get length() {
      return entries.size
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => {
      entries.delete(key)
    },
    setItem: (key, value) => {
      entries.set(key, value)
    },
  }
}
Object.defineProperty(globalThis, 'sessionStorage', { value: memoryStorage() })
Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage() })

const branch = reactive<{ activeBranch: { id: string } | null }>({ activeBranch: { id: 'A' } })
const auth = reactive<{ sessionEpoch: number; client: { id: string } | null }>({
  sessionEpoch: 0,
  client: null,
})
const getCart = vi.fn()
const addItem = vi.fn()
const removeItem = vi.fn()
const setFulfillment = vi.fn()
const startCall = vi.fn()
const confirmCode = vi.fn()
const checkCall = vi.fn()
let quoteOptions: { queryKey: { value: unknown[] } } | undefined
const quoteData = ref<{ status: string; price: number } | null>(null)
const quoteFetching = ref(false)
const quotePending = ref(false)
const quoteError = ref(false)

vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/franchise/stores/franchise.store', () => ({
  useFranchiseStore: () => ({ addressMap: false }),
}))
vi.mock('@/modules/cart/api/cart.service', () => ({
  CartService: { getCart, addItem, removeItem, setFulfillment },
}))
vi.mock('@/api/errors', () => ({ getApiErrorCode: () => null }))
vi.mock('@/api/socket', () => ({ getSocket: vi.fn() }))
vi.mock('@/i18n', () => ({ t: (key: string) => key }))
vi.mock('@/modules/auth/api/auth.service', () => ({
  AuthService: { startCall, confirmCode, checkCall },
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@tanstack/vue-query', () => ({
  useQuery: (options: typeof quoteOptions) => {
    quoteOptions = options
    return {
      data: quoteData,
      isFetching: quoteFetching,
      isPending: quotePending,
      isError: quoteError,
    }
  },
}))
vi.mock('@/modules/fulfillment/api/delivery.service', () => ({
  DeliveryService: { quote: vi.fn() },
}))
vi.mock('@/modules/fulfillment/utils/fulfillmentMethods', () => ({
  fulfillmentMethods: () => ['delivery', 'pickup'],
}))

const { useCartStore } = await import('@/modules/cart/stores/cart.store')
const { useFulfillmentStore } = await import('@/modules/fulfillment/stores/fulfillment.store')
Object.defineProperty(globalThis, 'document', {
  value: { addEventListener: vi.fn(), removeEventListener: vi.fn(), visibilityState: 'visible' },
})
const { useCallConfirmation } = await import('@/modules/auth/composables/useCallConfirmation')
const { useDeliveryQuote } = await import('@/modules/fulfillment/composables/useDeliveryQuote')

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}
function cart(id: string, quantity = 0) {
  return {
    id,
    items: quantity ? [{ key: 'item', product_id: 'p', quantity }] : [],
    total_quantity: quantity,
    total_amount: 100 * quantity,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  branch.activeBranch = { id: 'A' }
  auth.sessionEpoch = 0
  auth.client = null
  getCart.mockReset()
  addItem.mockReset()
  removeItem.mockReset()
  setFulfillment.mockReset()
  startCall.mockReset()
  confirmCode.mockReset()
  checkCall.mockReset()
  sessionStorage.clear()
  localStorage.clear()
  quoteData.value = null
  quoteFetching.value = false
  quotePending.value = false
  quoteError.value = false
})

describe('delivery quote freshness', () => {
  it('hides a previous quote while a changed address or cart is pending', async () => {
    getCart.mockResolvedValue(cart('A-cart', 1))
    const cartStore = useCartStore()
    await cartStore.fetchCart('A')
    const address = ref({ latitude: 1, longitude: 2, city: 'A' })
    quoteData.value = { status: 'ok', price: 100 }
    const quote = useDeliveryQuote(() => address.value as never)
    const oldKey = JSON.stringify(quoteOptions?.queryKey.value)
    expect(quote.price.value).toBe(100)
    address.value = { latitude: 1, longitude: 2, city: 'B' }
    quoteFetching.value = true
    expect(JSON.stringify(quoteOptions?.queryKey.value)).not.toBe(oldKey)
    expect(quote.price.value).toBeNull()
    expect(quote.blocked.value).toBe(true)
    quoteFetching.value = false
    quoteData.value = { status: 'ok', price: 150 }
    expect(quote.price.value).toBe(150)
  })

  it('hides a cached quote after a request error and a branch change', () => {
    const address = ref({ latitude: 1, longitude: 2, city: 'A' })
    quoteData.value = { status: 'ok', price: 100 }
    const quote = useDeliveryQuote(() => address.value as never)
    expect(quote.price.value).toBe(100)
    quoteError.value = true
    expect(quote.quote.value).toBeNull()
    expect(quote.blocked.value).toBe(true)
    quoteError.value = false
    branch.activeBranch = { id: 'B' }
    quoteFetching.value = true
    expect(quote.price.value).toBeNull()
  })
})

describe('call confirmation attempts', () => {
  it('ignores late start success after reset and a newer start', async () => {
    const old = deferred<{ confirmation_id: string; expires_in: number }>()
    startCall
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce({ confirmation_id: 'new', expires_in: 30 })
    const scope = effectScope()
    const confirmation = scope.run(() => useCallConfirmation(vi.fn()))!
    const pending = confirmation.start('old')
    confirmation.reset()
    const current = confirmation.start('new')
    await current
    old.resolve({ confirmation_id: 'old', expires_in: 30 })
    await pending
    expect(confirmation.confirmation.value?.confirmation_id).toBe('new')
    scope.stop()
  })

  it('ignores late start error after dispose', async () => {
    const old = deferred<{ confirmation_id: string; expires_in: number }>()
    startCall.mockReturnValue(old.promise)
    const scope = effectScope()
    const confirmation = scope.run(() => useCallConfirmation(vi.fn()))!
    const pending = confirmation.start('old')
    scope.stop()
    old.resolve({ confirmation_id: 'old', expires_in: 30 })
    await pending
    expect(confirmation.confirmation.value).toBeNull()
    expect(confirmation.isStarting.value).toBe(false)
  })

  it('ignores a late error from the old attempt after a new start', async () => {
    const old = deferred<{ confirmation_id: string; expires_in: number }>()
    startCall
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce({ confirmation_id: 'new', expires_in: 30 })
    const scope = effectScope()
    const confirmation = scope.run(() => useCallConfirmation(vi.fn()))!
    const pending = confirmation.start('old')
    confirmation.reset()
    await confirmation.start('new')
    old.reject(new Error('Old network failure'))
    await pending
    expect(confirmation.confirmation.value?.confirmation_id).toBe('new')
    expect(confirmation.errorMessage.value).toBeNull()
    scope.stop()
  })
})

describe('cart response ownership', () => {
  it('ignores a late A response after switching to B', async () => {
    const a = deferred<ReturnType<typeof cart>>()
    const b = deferred<ReturnType<typeof cart>>()
    getCart.mockImplementation((id: string) => (id === 'A' ? a.promise : b.promise))
    const store = useCartStore()
    const old = store.fetchCart('A')
    branch.activeBranch = { id: 'B' }
    const fresh = store.fetchCart('B')
    b.resolve(cart('B-cart'))
    await fresh
    a.resolve(cart('A-cart'))
    await old
    expect(store.cart?.id).toBe('B-cart')
  })

  it('serializes rapid relative changes and retains the latest quantity', async () => {
    getCart.mockResolvedValue(cart('A-cart', 1))
    const first = deferred<ReturnType<typeof cart>>()
    addItem.mockReturnValueOnce(first.promise).mockResolvedValueOnce(cart('A-cart', 3))
    const store = useCartStore()
    await store.fetchCart('A')
    const one = store.addItem('p')
    const two = store.addItem('p')
    await nextTick()
    expect(addItem).toHaveBeenCalledTimes(1)
    first.resolve(cart('A-cart', 2))
    await Promise.all([one, two])
    expect(addItem).toHaveBeenCalledTimes(2)
    expect(store.totalQuantity).toBe(3)
  })

  it('does not let an old account mutation overwrite a new account cart', async () => {
    getCart.mockResolvedValueOnce(cart('A-cart', 1)).mockResolvedValueOnce(cart('B-cart'))
    const oldMutation = deferred<ReturnType<typeof cart>>()
    addItem.mockReturnValue(oldMutation.promise)
    const store = useCartStore()
    await store.fetchCart('A')
    const pending = store.addItem('p')
    await nextTick()
    auth.sessionEpoch++
    await store.fetchCart('A')
    oldMutation.resolve(cart('A-cart', 2))
    await pending
    expect(store.cart?.id).toBe('B-cart')
    expect(store.totalQuantity).toBe(0)
  })

  it('keeps B cart when an A mutation completes after a branch switch', async () => {
    getCart.mockResolvedValueOnce(cart('A-cart', 1)).mockResolvedValueOnce(cart('B-cart', 0))
    const oldMutation = deferred<ReturnType<typeof cart>>()
    addItem.mockReturnValue(oldMutation.promise)
    const store = useCartStore()
    await store.fetchCart('A')
    const pending = store.addItem('p')
    await nextTick()
    branch.activeBranch = { id: 'B' }
    await store.fetchCart('B')
    oldMutation.resolve(cart('A-cart', 2))
    await pending
    expect(store.cart?.id).toBe('B-cart')
  })

  it('rejects an old A mutation after A to B to A', async () => {
    getCart.mockResolvedValueOnce(cart('old-A', 1)).mockResolvedValueOnce(cart('new-A', 0))
    const oldMutation = deferred<ReturnType<typeof cart>>()
    addItem.mockReturnValue(oldMutation.promise)
    const store = useCartStore()
    await store.fetchCart('A')
    const pending = store.addItem('p')
    await nextTick()
    branch.activeBranch = { id: 'B' }
    branch.activeBranch = { id: 'A' }
    await store.fetchCart('A')
    oldMutation.resolve(cart('old-A', 2))
    await pending
    expect(store.cart?.id).toBe('new-A')
  })

  it('queues fast fulfillment toggles in user order', async () => {
    getCart.mockResolvedValue({ ...cart('A-cart', 1), fulfillment_type: 'delivery' })
    setFulfillment.mockImplementation(async (_id: string, type: string) => ({
      ...cart('A-cart', 1),
      fulfillment_type: type,
    }))
    const store = useCartStore()
    await store.fetchCart('A')
    await Promise.all([store.setFulfillment('pickup'), store.setFulfillment('delivery')])
    expect(setFulfillment.mock.calls.map((call) => call[1])).toEqual(['pickup', 'delivery'])
    expect(store.cart?.fulfillment_type).toBe('delivery')
  })

  it('blocks checkout while an unavailable row remains and clears it with remove all', async () => {
    const unavailableCart = {
      ...cart('A-cart', 1),
      items: [{ key: 'missing', product_id: 'p', quantity: 1, unavailable: true }],
      total_quantity: 0,
      total_amount: 0,
    }
    getCart.mockResolvedValue(unavailableCart)
    removeItem.mockResolvedValue(cart('A-cart'))
    const store = useCartStore()
    await store.fetchCart('A')
    expect(store.hasStopped).toBe(true)
    expect(store.isEmpty).toBe(false)

    await store.removeAllOfItem('missing')
    expect(removeItem).toHaveBeenCalledWith('A-cart', 'missing', true)
    expect(store.hasStopped).toBe(false)
    expect(store.isEmpty).toBe(true)
  })
})

describe('fulfillment address ownership', () => {
  it('keeps guest choice on first login and clears A address on logout and B login', () => {
    const store = useFulfillmentStore()
    const address = { ...emptyDeliveryAddress('A secret'), street: 'Main', house: '7' }
    store.choose('A', { type: 'delivery', address })
    auth.client = { id: 'A' }
    expect(store.deliveryAddress).toEqual(address)
    auth.client = null
    auth.client = { id: 'B' }
    expect(store.deliveryAddress).toBeNull()
    expect(JSON.parse(sessionStorage.getItem('fulfillment:v2')!).owner).toBe('B')
    setActivePinia(createPinia())
    expect(useFulfillmentStore().deliveryAddress).toBeNull()
  })

  it('requires a choice again when an older session silently saved an empty delivery address', () => {
    sessionStorage.setItem(
      'fulfillment:v2',
      JSON.stringify({
        owner: 'guest',
        choices: { A: { type: 'delivery', address: emptyDeliveryAddress() } },
      }),
    )
    const store = useFulfillmentStore()
    expect(store.current).toBeNull()
  })

  it('ignores an incomplete delivery choice from an older session', () => {
    sessionStorage.setItem(
      'fulfillment:v2',
      JSON.stringify({
        owner: 'guest',
        choices: { A: { type: 'delivery', address: { city: 'Moscow' } } },
      }),
    )
    expect(useFulfillmentStore().current).toBeNull()
  })

  it('rejects unowned legacy persisted addresses', () => {
    localStorage.setItem(
      'fulfillment',
      JSON.stringify({ choices: { A: { type: 'delivery', address: { city: 'A secret' } } } }),
    )
    auth.client = { id: 'B' }
    const store = useFulfillmentStore()
    expect(store.deliveryAddress).toBeNull()
    expect(localStorage.getItem('fulfillment')).toBeNull()
  })
})
