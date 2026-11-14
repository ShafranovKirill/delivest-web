import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, reactive } from 'vue'
import { renderToString } from 'vue/server-renderer'

const branch = reactive({
  mapAddress: true,
  branches: [{ is_active: true, branch_info: { latitude: 55.75 as number | null, longitude: 37.61 as number | null, fulfillment_methods: ['pickup'] } }],
})
const franchise = reactive({ addressMap: true })
const flow = reactive({ pickerMode: 'delivery', isPickerOpen: false, dismiss: vi.fn(), abandon: vi.fn() })
vi.mock('../src/modules/fulfillment/utils/panes', () => ({ loadDeliveryPane: () => Promise.resolve(defineComponent({ render: () => null })), loadPickupPane: () => Promise.resolve(defineComponent({ render: () => null })) }))
vi.mock('vue-i18n', async (importOriginal) => ({ ...(await importOriginal<typeof import('vue-i18n')>()), useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('../src/modules/fulfillment/stores/fulfillmentFlow.store', () => ({ useFulfillmentFlowStore: () => flow }))
vi.mock('../src/modules/fulfillment/stores/fulfillment.store', () => ({ useFulfillmentStore: () => ({ availableModes: ['delivery', 'pickup'], methods: ['pickup'] }) }))
vi.mock('../src/modules/fulfillment/components/MapDialog.vue', () => ({ default: defineComponent({ props: ['compact'], setup: (props) => () => h('div', { 'data-compact': String(props.compact) }) }) }))
vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('@/modules/franchise/stores/franchise.store', () => ({ useFranchiseStore: () => franchise }))
vi.mock('../src/modules/fulfillment/composables/useAddressEditor', () => ({
  useAddressEditor: () => ({ mapCenter: [0, 0], isLocating: false, locate: vi.fn(), isReady: true, pickSuggestion: vi.fn(), pickSaved: vi.fn() }),
}))
vi.mock('../src/modules/fulfillment/composables/useDeliveryAddresses', () => ({ useDeliveryAddresses: () => ({ value: [] }) }))
vi.mock('../src/modules/fulfillment/components/map/MapPlaceholder.vue', () => ({ default: defineComponent({ setup: () => () => h('div', { 'data-map-placeholder': '' }) }) }))
vi.mock('../src/modules/fulfillment/components/map/BaseMap.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('section', { 'data-map': '' }, slots.default?.()) }) }))
vi.mock('../src/modules/fulfillment/components/delivery/DeliveryAddressForm.vue', () => ({ default: defineComponent({ props: ['suggest'], setup: (props) => () => h('div', { 'data-suggest': String(props.suggest) }) }) }))
vi.mock('../src/modules/fulfillment/components/delivery/SavedAddresses.vue', () => ({ default: defineComponent({ setup: () => () => h('div', { 'data-saved-list': '' }) }) }))
vi.mock('../src/modules/fulfillment/components/delivery/SavedAddressesButton.vue', () => ({ default: defineComponent({ setup: () => () => h('div', { 'data-saved-map': '' }) }) }))
vi.mock('../src/modules/fulfillment/components/SheetPanel.vue', () => ({ default: defineComponent({ props: ['floating'], setup: (props, { slots }) => () => h('div', { 'data-floating': String(props.floating) }, slots.default?.()) }) }))

import AddressEditor from '../src/modules/fulfillment/components/delivery/AddressEditor.vue'
import FulfillmentPicker from '../src/modules/fulfillment/components/FulfillmentPicker.vue'
import PaneSkeleton from '../src/modules/fulfillment/components/PaneSkeleton.vue'

async function render() {
  return renderToString(createSSRApp(AddressEditor, {
    modelValue: { city: 'Moscow', street: 'Main', house: '1' },
    city: 'Moscow',
    saved: true,
  }))
}

describe('delivery address editor mode', () => {
  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
    [false, false, false],
  ])('integration %s and branch map %s renders map %s', async (integration, enabled, map) => {
    franchise.addressMap = integration
    branch.mapAddress = enabled
    const html = await render()
    expect(html.includes('data-map')).toBe(map)
    expect(html).toContain(`data-suggest="${map}"`)
    expect(html).toContain(`data-floating="${map}"`)
    expect(html.includes('data-saved-list')).toBe(!map)
    expect(html.includes('data-saved-map')).toBe(map)
  })
})

describe('fulfillment picker map layout', () => {
  it.each([
    ['delivery', true, true, 'false'],
    ['delivery', false, true, 'true'],
    ['pickup', false, true, 'false'],
    ['pickup', true, false, 'true'],
  ])('mode %s, branch map %s, integration %s gives compact %s', async (mode, enabled, integration, compact) => {
    flow.pickerMode = mode
    branch.mapAddress = enabled
    franchise.addressMap = integration
    const html = await renderToString(createSSRApp(FulfillmentPicker))
    expect(html).toContain(`data-compact="${compact}"`)
  })

  it('uses a compact picker when onsite branches have no coordinates', async () => {
    flow.pickerMode = 'pickup'
    franchise.addressMap = true
    branch.branches[0]!.branch_info.latitude = null
    branch.branches[0]!.branch_info.longitude = null
    const html = await renderToString(createSSRApp(FulfillmentPicker))
    expect(html).toContain('data-compact="true"')
    branch.branches[0]!.branch_info.latitude = 55.75
    branch.branches[0]!.branch_info.longitude = 37.61
  })
})

describe('loading pane map placeholder', () => {
  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
  ])('integration %s and delivery map %s renders placeholder %s', async (integration, enabled, map) => {
    franchise.addressMap = integration
    branch.mapAddress = enabled
    const html = await renderToString(createSSRApp(PaneSkeleton))
    expect(html.includes('data-map-placeholder')).toBe(map)
    expect(html).toContain(`data-floating="${map}"`)
  })

  it('keeps the pickup placeholder with manual delivery mode', async () => {
    franchise.addressMap = true
    branch.mapAddress = false
    const html = await renderToString(createSSRApp(PaneSkeleton, { map: true }))
    expect(html).toContain('data-map-placeholder')
    expect(html).toContain('data-floating="true"')
  })
})
