import { describe, expect, it, vi } from 'vitest'

const get = vi.fn()
vi.mock('@/api/client', () => ({ api: { get } }))

const { GeoService } = await import('@/modules/fulfillment/api/geo.service')

describe('delivery address suggestions', () => {
  it('can return another city without an explicit city prefix', async () => {
    const address = { city: 'Соседний город', value: 'улица Мира, 1' }
    get.mockResolvedValueOnce({ data: { data: [address] } })

    expect(await GeoService.suggest('улица Мира')).toEqual([address])
    expect(get).toHaveBeenCalledWith('/client/geo/suggest', {
      params: { query: 'улица Мира' },
    })
  })
})
