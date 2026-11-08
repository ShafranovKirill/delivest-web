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
  it('allows a complete address in a neighboring city to proceed to the delivery quote', () => {
    const address = ref({
      ...emptyDeliveryAddress('Соседний город'),
      street: 'Мира',
      house: '1',
    })
    expect(useAddressEditor(address).isReady.value).toBe(true)
  })

  it('shows saved addresses from all cities', () => {
    expect(useDeliveryAddresses().value.map((address) => address.id)).toEqual(['local', 'nearby'])
  })
})
