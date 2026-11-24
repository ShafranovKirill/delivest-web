import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'
import {
  emptyDeliveryAddress,
  isManualAddressReady,
} from '@/modules/fulfillment/utils/deliveryAddress'

const branch = reactive({
  activeBranch: { id: 'A', branch_info: { city: 'Москва' } } as {
    id: string
    branch_info: { city: string }
  } | null,
  mapAddress: false,
  showCity: false,
  requiresCoordinates: false,
  operatorAddress: false,
  methods: ['delivery'],
})
const auth = reactive<{ client: { id: string } | null }>({ client: null })

vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/fulfillment/utils/fulfillmentMethods', () => ({
  fulfillmentMethods: () => branch.methods,
}))

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

const { useFulfillmentStore } = await import('@/modules/fulfillment/stores/fulfillment.store')
const { useFulfillmentFlowStore } =
  await import('@/modules/fulfillment/stores/fulfillmentFlow.store')

beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
  localStorage.clear()
  auth.client = null
  branch.activeBranch = { id: 'A', branch_info: { city: 'Москва' } }
  branch.mapAddress = false
  branch.showCity = false
  branch.methods = ['delivery']
})

describe('manual delivery selection', () => {
  it('selects no-map delivery without exposing an incomplete address as current', async () => {
    const flow = useFulfillmentFlowStore()
    const fulfillment = useFulfillmentStore()
    expect(await flow.ensure()).toBe(true)
    expect(flow.manualDeliverySelected).toBe(true)
    expect(flow.isPickerOpen).toBe(false)
    expect(fulfillment.current).toBeNull()
    expect(flow.addressDrafts.A?.city).toBe('Москва')
  })

  it('invalidates a previously valid address when its street is cleared', () => {
    const flow = useFulfillmentFlowStore()
    const fulfillment = useFulfillmentStore()
    flow.chooseManualDelivery()
    const valid = { ...emptyDeliveryAddress('Москва'), street: 'Тверская' }
    flow.saveAddressDraft('A', valid)
    fulfillment.choose('A', { type: 'delivery', address: valid })
    expect(fulfillment.current?.type).toBe('delivery')

    const cleared = { ...valid, street: '' }
    flow.saveAddressDraft('A', cleared)
    fulfillment.choose('A', { type: 'delivery', address: cleared })
    expect(isManualAddressReady(flow.addressDrafts.A!, false)).toBe(false)
    expect(fulfillment.current).toBeNull()
    expect(fulfillment.deliveryAddress).toBeNull()
  })

  it('requires city only for branches that show the city field', () => {
    const fulfillment = useFulfillmentStore()
    const address = { ...emptyDeliveryAddress(), street: 'Тверская' }
    expect(isManualAddressReady(address, false)).toBe(true)
    expect(isManualAddressReady(address, true)).toBe(false)
    branch.showCity = true
    fulfillment.choose('A', { type: 'delivery', address })
    expect(fulfillment.current).toBeNull()
    expect(isManualAddressReady({ ...address, city: 'Тула' }, true)).toBe(true)
    fulfillment.choose('A', { type: 'delivery', address: { ...address, city: 'Тула' } })
    expect(fulfillment.current?.type).toBe('delivery')
  })

  it('resets manual selection when branch or address mode changes', () => {
    const flow = useFulfillmentFlowStore()
    flow.chooseManualDelivery()
    expect(flow.manualDeliverySelected).toBe(true)
    branch.activeBranch = { id: 'B', branch_info: { city: 'Тула' } }
    expect(flow.manualDeliverySelected).toBe(false)
    branch.activeBranch = { id: 'A', branch_info: { city: 'Москва' } }
    expect(flow.manualDeliverySelected).toBe(false)
    flow.chooseManualDelivery()
    branch.mapAddress = true
    expect(flow.manualDeliverySelected).toBe(false)
    branch.mapAddress = false
    expect(flow.manualDeliverySelected).toBe(false)
    flow.chooseManualDelivery()
    branch.methods = ['pickup']
    expect(flow.manualDeliverySelected).toBe(false)
  })

  it('does not accept a manual draft when delivery is disabled', async () => {
    const flow = useFulfillmentFlowStore()
    flow.chooseManualDelivery()
    branch.methods = []
    expect(flow.manualDeliverySelected).toBe(false)
    expect(await flow.ensure()).toBe(false)
  })

  it('switches from pickup to a manual delivery draft and back to pickup', async () => {
    branch.methods = ['delivery', 'pickup']
    const flow = useFulfillmentFlowStore()
    const fulfillment = useFulfillmentStore()
    fulfillment.choose('A', { type: 'pickup', pickupKind: 'pickup' })
    expect(fulfillment.current?.type).toBe('pickup')

    flow.openPicker('delivery')
    expect(flow.manualDeliverySelected).toBe(true)
    expect(fulfillment.current).toBeNull()
    expect(await flow.ensure()).toBe(true)

    flow.openPicker('pickup')
    expect(flow.manualDeliverySelected).toBe(false)
    expect(flow.isPickerOpen).toBe(true)
  })
})
