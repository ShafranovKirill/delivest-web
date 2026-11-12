import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'

const branch = reactive({
  activeBranch: { id: 'A', operator: true, methods: ['delivery', 'pickup'] } as
    | { id: string; operator: boolean; methods: string[] }
    | null,
})
const auth = reactive<{ client: { id: string } | null }>({ client: null })

vi.mock('@/modules/branch/stores/branch.store', () => ({
  useBranchStore: () => ({
    get activeBranch() { return branch.activeBranch },
    get operatorAddress() { return branch.activeBranch?.operator === true },
  }),
}))
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/fulfillment/utils/fulfillmentMethods', () => ({
  fulfillmentMethods: (value: typeof branch.activeBranch) => value?.methods ?? [],
}))

const storage = () => {
  const entries = new Map<string, string>()
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value) },
    removeItem: (key: string) => { entries.delete(key) },
    clear: () => { entries.clear() },
  }
}
Object.defineProperty(globalThis, 'sessionStorage', { value: storage() })
Object.defineProperty(globalThis, 'localStorage', { value: storage() })

const { useFulfillmentStore } = await import('@/modules/fulfillment/stores/fulfillment.store')
const { emptyDeliveryAddress } = await import('@/modules/fulfillment/utils/deliveryAddress')

beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
  localStorage.clear()
  auth.client = null
  branch.activeBranch = { id: 'A', operator: true, methods: ['delivery', 'pickup'] }
})

describe('operator address choice', () => {
  it('keeps an addressless operator choice separate from a manual address', () => {
    const store = useFulfillmentStore()
    store.choose('A', { type: 'delivery', address: null, addressByOperator: true })
    expect(store.addressByOperator).toBe(true)
    expect(store.deliveryAddress).toBeNull()
    const address = { ...emptyDeliveryAddress('Москва'), street: 'Тверская', house: '7' }
    store.choose('A', { type: 'delivery', address, addressByOperator: false })
    expect(store.addressByOperator).toBe(false)
    expect(store.deliveryAddress).toEqual(address)
  })

  it('honors the branch flag and isolates branch choices', () => {
    const store = useFulfillmentStore()
    store.choose('A', { type: 'delivery', address: null, addressByOperator: true })
    branch.activeBranch = { id: 'B', operator: false, methods: ['delivery'] }
    expect(store.current).toBeNull()
    store.choose('B', { type: 'delivery', address: null, addressByOperator: true })
    expect(store.addressByOperator).toBe(false)
    branch.activeBranch = { id: 'A', operator: true, methods: ['pickup'] }
    expect(store.current).toBeNull()
    branch.activeBranch = { id: 'A', operator: true, methods: ['delivery'] }
    expect(store.addressByOperator).toBe(true)
  })

  it('does not expose a previous account choice to the next account', () => {
    const store = useFulfillmentStore()
    auth.client = { id: 'owner-a' }
    store.choose('A', { type: 'delivery', address: null, addressByOperator: true })
    auth.client = { id: 'owner-b' }
    expect(store.current).toBeNull()
    expect(store.addressByOperator).toBe(false)
  })
})
