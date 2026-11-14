import { describe, expect, it, vi } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import DeliveryQuoteSummary from '../src/modules/fulfillment/components/delivery/DeliveryQuoteSummary.vue'
import type { DeliveryQuote } from '../src/modules/fulfillment/api/delivery.service'

vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-i18n')>()),
  useI18n: () => ({ t: (key: string) => key }),
}))

const baseProps = {
  ready: false,
  pending: false,
  selecting: false,
  needsZoom: false,
  error: false,
}

describe('delivery quote summary', () => {
  it('prompts for an address before a point is chosen', async () => {
    const html = await renderToString(
      createSSRApp(DeliveryQuoteSummary, { ...baseProps, quote: null, hasPoint: false }),
    )
    expect(html).toContain('delivery.costTitle')
    expect(html).toContain('delivery.selectAddress')
  })

  it('shows the quoted amount without the internal zone name', async () => {
    const quote: DeliveryQuote = {
      status: 'below_minimum',
      price: 15000,
      min_order: 50000,
      free_from: 100000,
      minutes: 45,
      zone_name: 'Internal zone name',
    }
    const html = await renderToString(
      createSSRApp(DeliveryQuoteSummary, {
        ...baseProps,
        quote,
        hasPoint: true,
        ready: true,
      }),
    )
    expect(html).toContain('delivery.costTitle')
    expect(html).not.toContain('Internal zone name')
    expect(html).toContain('150')
    expect(html).not.toContain('<button')
  })
})
