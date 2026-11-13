import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

vi.mock('@/modules/branch/stores/branch.store', () => ({
  useBranchStore: () => ({ activeBranch: null, branches: [] }),
}))
vi.mock('@/modules/account/composables/useAddressesQuery', () => ({
  useAddressesQuery: () => ({
    data: ref([
      { id: 'local', city: 'Основной город' },
      { id: 'nearby', city: 'Соседний город' },
    ]),
  }),
}))
vi.mock('@/modules/fulfillment/composables/useReverseGeocode', () => ({
  useReverseGeocode: () => ({ isLocating: ref(false), locate: vi.fn(), remember: vi.fn() }),
}))

const { useAddressEditor } = await import('@/modules/fulfillment/composables/useAddressEditor')
const { useDeliveryAddresses } =
  await import('@/modules/fulfillment/composables/useDeliveryAddresses')
const { emptyDeliveryAddress } = await import('@/modules/fulfillment/utils/deliveryAddress')

describe('cross-city delivery addresses', () => {
  it('accepts manual address text when the house is not parsed into a separate field', () => {
    const address = ref({
      ...emptyDeliveryAddress(),
      street: 'Тверская 7к1',
    })
    expect(useAddressEditor(address, () => false).isReady.value).toBe(true)
    expect(useAddressEditor(address, () => true).isReady.value).toBe(false)
  })

  it('allows a complete address in a neighboring city to proceed to the delivery quote', () => {
    const address = ref({
      ...emptyDeliveryAddress('Соседний город'),
      street: 'Мира',
      house: '1',
    })
    const editor = useAddressEditor(address, () => true)
    expect(editor.isReady.value).toBe(false)
    address.value = { ...address.value, latitude: 55.75, longitude: 37.62 }
    expect(editor.isReady.value).toBe(true)
    address.value = { ...address.value, latitude: null, longitude: null }
    expect(useAddressEditor(address, () => false).isReady.value).toBe(true)
  })

  it('shows saved addresses from all cities', () => {
    expect(useDeliveryAddresses().value.map((address) => address.id)).toEqual(['local', 'nearby'])
  })
})
