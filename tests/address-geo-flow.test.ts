import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseAddress } from '../src/modules/fulfillment/utils/parseAddress'
import { ref } from 'vue'
import { emptyDeliveryAddress } from '../src/modules/fulfillment/utils/deliveryAddress'

const reverse = vi.fn()
const suggest = vi.fn()
vi.mock('../src/modules/fulfillment/api/geo.service', () => ({ GeoService: { reverse, suggest } }))
vi.mock('@/modules/branch/stores/branch.store', () => ({
  useBranchStore: () => ({ activeBranch: null, branches: [], mapAddress: true }),
}))

const { useReverseGeocode } =
  await import('../src/modules/fulfillment/composables/useReverseGeocode')
const { useAddressSuggestions } =
  await import('../src/modules/fulfillment/composables/useAddressSuggestions')
const { useAddressEditor } = await import('../src/modules/fulfillment/composables/useAddressEditor')

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('manual address', () => {
  it.each([
    ['Тверская 7к1', 'Москва', '', 'Тверская', '7к1'],
    ['Тверская, 7, корпус 2', 'Москва', '', 'Тверская', '7 корпус 2'],
    ['Тверская, д. 7 корп. 2', 'Москва', '', 'Тверская', '7 корп. 2'],
    ['Тверская, 7 к 1 стр 2', 'Москва', '', 'Тверская', '7 к 1 стр 2'],
    ['Москва Тверская 7', 'Москва', 'Москва', 'Тверская', '7'],
    ['Тула, Советская 7', 'Москва', 'Тула', 'Советская', '7'],
    ['улица 1905 года, д 7', 'Москва', '', 'улица 1905 года', '7'],
  ])('%s', (input, branch, city, street, house) => {
    expect(parseAddress(input, branch)).toEqual({ city, street, house })
  })
})

describe('reverse geocode', () => {
  it('ignores a stale answer after an edit and allows retry after failure', async () => {
    vi.useFakeTimers()
    let finish!: (value: null) => void
    reverse.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    reverse.mockRejectedValueOnce(new Error('offline'))
    reverse.mockResolvedValueOnce(null)
    const found = vi.fn()
    const flow = useReverseGeocode(found)

    flow.locate([1, 2], 17)
    await vi.advanceTimersByTimeAsync(700)
    flow.remember()
    finish(null)
    await Promise.resolve()
    expect(found).not.toHaveBeenCalled()

    flow.locate([1, 2], 17)
    await vi.advanceTimersByTimeAsync(700)
    expect(flow.locateError.value).toBe(true)
    flow.locate([1, 2], 17)
    await vi.advanceTimersByTimeAsync(700)
    expect(flow.notFound.value).toBe(true)
    expect(found).toHaveBeenCalledWith(null, [1, 2])
  })
})

describe('map pin selection', () => {
  it('clears the previous address while moving and ignores a late reverse result after manual edit', async () => {
    vi.useFakeTimers()
    let finish!: (value: unknown) => void
    reverse.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const address = ref({
      ...emptyDeliveryAddress('Москва'),
      street: 'Старая',
      house: '7',
      latitude: 55,
      longitude: 37,
    })
    const editor = useAddressEditor(address, () => true)
    expect(editor.isReady.value).toBe(true)
    editor.startMoving()
    expect(editor.isReady.value).toBe(false)
    expect(address.value.street).toBe('')
    expect(address.value.latitude).toBeNull()

    editor.locate([38, 56], 17)
    await vi.advanceTimersByTimeAsync(700)
    address.value = { ...address.value, street: 'Вручную' }
    finish({ value: 'Поздний ответ', city: 'Москва', street: 'Поздняя', house: '8' })
    await Promise.resolve()
    expect(address.value.street).toBe('Вручную')
    expect(editor.isReady.value).toBe(false)
  })
})

describe('suggestions', () => {
  it('clears old options for a short query and ignores a late answer', async () => {
    vi.useFakeTimers()
    let finish!: (value: unknown[]) => void
    suggest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const flow = useAddressSuggestions()
    flow.search('Ленина', 'Тюмень')
    await vi.advanceTimersByTimeAsync(550)
    flow.search('Ле', 'Тюмень')
    finish([{ value: 'old' }])
    await Promise.resolve()
    expect(flow.suggestions.value).toEqual([])
    expect(flow.hasSearched.value).toBe(false)
  })

  it('does not cache a failed request as an empty result', async () => {
    vi.useFakeTimers()
    suggest.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([{ value: 'new' }])
    const flow = useAddressSuggestions()
    flow.search('Ленина')
    await vi.advanceTimersByTimeAsync(550)
    expect(flow.error.value).toBe(true)
    flow.search('Ленина')
    await vi.advanceTimersByTimeAsync(550)
    expect(flow.suggestions.value).toEqual([{ value: 'new' }])
  })
})
