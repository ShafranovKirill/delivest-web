import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp, nextTick, reactive } from 'vue'

const branch = reactive<{ activeBranch: { id: string } | null }>({
  activeBranch: { id: 'branch-a' },
})
const auth = reactive({ sessionEpoch: 0, client: null as { id: string } | null })
const franchise = reactive({ cutleryEnabled: true })

vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/franchise/stores/franchise.store', () => ({
  useFranchiseStore: () => franchise,
}))
vi.mock('@/modules/analytics/useFunnelAnalytics', () => ({ useFunnelAnalytics: () => ({}) }))
vi.mock('@/modules/cart/api/cart.service', () => ({ CartService: {} }))

const { useCartStore } = await import('../src/modules/cart/stores/cart.store')

function cart(total: number, id = 'cart-a') {
  return {
    id,
    items: [{ key: 'item', quantity: 1 }],
    total_quantity: 1,
    subtotal_amount: total + 50_000,
    discount_amount: 50_000,
    total_amount: total,
  } as Parameters<ReturnType<typeof useCartStore>['setSessionCart']>[0]
}

const storage = new Map<string, string>()
const localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value)
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
}

function freshPinia() {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  createApp({}).use(pinia)
  setActivePinia(pinia)
}

beforeEach(() => {
  storage.clear()
  vi.stubGlobal('localStorage', localStorage)
  vi.stubGlobal('window', { localStorage })
  freshPinia()
  branch.activeBranch = { id: 'branch-a' }
  auth.sessionEpoch = 0
  auth.client = null
  franchise.cutleryEnabled = true
})

describe('cart cutlery', () => {
  it('uses the discounted food total in kopecks, rounds up, and caps at 99', () => {
    const store = useCartStore()
    store.setSessionCart(cart(100_000))
    expect(store.cutleryCount).toBe(1)
    store.setSessionCart(cart(100_001))
    expect(store.cutleryCount).toBe(2)
    store.setSessionCart(cart(0))
    expect(store.cutleryCount).toBe(1)
    store.setSessionCart(cart(10_000_000))
    expect(store.cutleryCount).toBe(99)
  })

  it('keeps a manual zero through cart updates and resets on clear or replacement', () => {
    const store = useCartStore()
    store.setSessionCart(cart(250_000))
    expect(store.cutleryCount).toBe(3)
    store.setCutleryCount(0)
    store.setSessionCart(cart(400_000))
    expect(store.cutleryCount).toBe(0)
    store.setSessionCart(cart(400_000, 'cart-b'))
    expect(store.cutleryCount).toBe(4)
    store.setCutleryCount(99)
    store.setSessionCart({ ...cart(400_000, 'cart-b'), items: [] })
    expect(store.cutleryCount).toBe(0)
    store.setSessionCart(cart(400_000, 'cart-b'))
    expect(store.cutleryCount).toBe(4)
  })

  it('keeps a hydrated choice while the initial branch loads, then clears on context changes', async () => {
    const store = useCartStore()
    store.setSessionCart(cart(250_000))
    store.setCutleryCount(0)
    await nextTick()
    expect(storage.get('cart')).toContain('"quantity":0')

    branch.activeBranch = null
    freshPinia()
    const restored = useCartStore()
    branch.activeBranch = { id: 'branch-a' }
    restored.setSessionCart(cart(250_000))
    expect(restored.cutleryCount).toBe(0)
    branch.activeBranch = { id: 'branch-b' }
    restored.setSessionCart(cart(250_000))
    expect(restored.cutleryCount).toBe(3)
    await nextTick()
    expect(JSON.parse(storage.get('cart') ?? '{}').cutlerySelection).toBeNull()
    restored.setCutleryCount(0)
    auth.sessionEpoch++
    auth.client = { id: 'customer' }
    restored.setSessionCart(cart(250_000))
    expect(restored.cutleryCount).toBe(3)
  })

  it('hides cutlery and ignores manual changes when disabled', () => {
    const store = useCartStore()
    store.setSessionCart(cart(250_000))
    franchise.cutleryEnabled = false
    expect(store.cutleryCount).toBe(0)
    store.setCutleryCount(0)
    franchise.cutleryEnabled = true
    expect(store.cutleryCount).toBe(3)
  })
})
