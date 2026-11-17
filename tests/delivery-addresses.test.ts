import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const reverseRemember = vi.hoisted(() => vi.fn())
const branchSettings = vi.hoisted(() => ({ mapAddress: false }))

vi.mock('@/modules/branch/stores/branch.store', () => ({
  useBranchStore: () => ({ activeBranch: null, branches: [], get mapAddress() { return branchSettings.mapAddress } }),
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
  useReverseGeocode: () => ({ isLocating: ref(false), locate: vi.fn(), remember: reverseRemember }),
}))

const { useAddressEditor } = await import('@/modules/fulfillment/composables/useAddressEditor')
const { useDeliveryAddresses } =
  await import('@/modules/fulfillment/composables/useDeliveryAddresses')
const { emptyDeliveryAddress } = await import('@/modules/fulfillment/utils/deliveryAddress')

describe('cross-city delivery addresses', () => {
  it('normalizes a legacy address containing a house before checking readiness', () => {
    const address = ref({
      ...emptyDeliveryAddress(),
      street: 'Тверская 7к1',
    })
    expect(useAddressEditor(address, () => false).isReady.value).toBe(true)
    expect(address.value.street).toBe('Тверская')
    expect(address.value.house).toBe('7к1')
    expect(useAddressEditor(address, () => true).isReady.value).toBe(false)
  })

  it('accepts a street-only manual address', () => {
    const address = ref({ ...emptyDeliveryAddress(), street: 'Тверская' })
    expect(useAddressEditor(address, () => false).isReady.value).toBe(true)
  })

  it('keeps map mode strict about the house and coordinates', () => {
    branchSettings.mapAddress = true
    try {
      const address = ref({ ...emptyDeliveryAddress(), street: 'Тверская' })
      const editor = useAddressEditor(address, () => true)
      expect(editor.isReady.value).toBe(false)
      address.value = { ...address.value, latitude: 55.75, longitude: 37.62 }
      expect(editor.isReady.value).toBe(false)
      address.value = { ...address.value, house: '7' }
      expect(editor.isReady.value).toBe(true)
    } finally {
      branchSettings.mapAddress = false
    }
  })

  it('normalizes a legacy stored address without a house key', () => {
    const address = ref({ ...emptyDeliveryAddress(), street: 'Тверская 7к1', house: undefined })
    const editor = useAddressEditor(
      address as unknown as Parameters<typeof useAddressEditor>[0],
      () => false,
    )
    expect(editor.isReady.value).toBe(true)
    expect(address.value.house).toBe('7к1')
  })

  it('invalidates reverse geocoding when an external draft replaces the address', () => {
    reverseRemember.mockClear()
    const address = ref(emptyDeliveryAddress())
    useAddressEditor(address, () => false)
    address.value = { ...emptyDeliveryAddress(), street: 'Арбат', house: '10' }
    expect(reverseRemember).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate reverse geocoding for its own point update', () => {
    reverseRemember.mockClear()
    const address = ref(emptyDeliveryAddress())
    useAddressEditor(address, () => true).locate([37.6, 55.7], 17)
    expect(reverseRemember).not.toHaveBeenCalled()
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
