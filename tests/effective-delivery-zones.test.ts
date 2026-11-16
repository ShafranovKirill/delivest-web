import { describe, expect, it } from 'vitest'
import * as clipping from 'polygon-clipping'
import type { DeliveryZone } from '@/modules/fulfillment/api/delivery.service'
import { effectiveDeliveryZones } from '@/modules/fulfillment/components/map/effectiveDeliveryZones'

function square(x1: number, y1: number, x2: number, y2: number): number[][][] {
  return [
    [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2],
      [x1, y1],
    ],
  ]
}

function zone(id: string, coordinates: number[][][]): DeliveryZone {
  return { id, name: id, color: '#000000', polygon: { type: 'Polygon', coordinates } }
}

describe('effective delivery zones', () => {
  it('subtracts every higher zone, including overlaps and full containment, without changing input', () => {
    const zones = [
      zone('first', square(0, 0, 3, 3)),
      zone('second', square(2, 0, 5, 3)),
      zone('hidden', square(1, 1, 2, 2)),
    ]
    const before = structuredClone(zones)
    const result = effectiveDeliveryZones(zones)
    expect(result.map((item) => item.id)).toEqual(['first', 'second'])
    expect(
      clipping.intersection(result[0]!.polygon.coordinates, result[1]!.polygon.coordinates),
    ).toEqual([])
    expect(result[1]!.polygon.coordinates).toEqual(
      clipping.difference(
        square(2, 0, 5, 3) as clipping.Polygon,
        square(0, 0, 3, 3) as clipping.Polygon,
      ),
    )
    expect(zones).toEqual(before)
  })

  it('keeps holes and split polygons', () => {
    const cut = zone('cut', square(2, -1, 4, 7))
    const wide = zone('wide', square(0, 0, 6, 6))
    const split = effectiveDeliveryZones([cut, wide])[1]!
    expect(split.polygon.coordinates).toHaveLength(2)

    const inner = zone('inner', square(2, 2, 4, 4))
    const outer = effectiveDeliveryZones([inner, wide])[1]!
    expect(outer.polygon.coordinates).toHaveLength(1)
    expect(outer.polygon.coordinates[0]).toHaveLength(2)
  })

  it('preserves disjoint zones and uses API order even when reordered', () => {
    const a = zone('a', square(0, 0, 2, 2))
    const b = zone('b', square(1, 0, 3, 2))
    const disjoint = zone('disjoint', square(5, 5, 6, 6))
    expect(effectiveDeliveryZones([a, disjoint])[1]!.polygon.coordinates).toEqual([
      disjoint.polygon.coordinates,
    ])
    expect(effectiveDeliveryZones([a, b])[0]!.polygon.coordinates).toEqual([a.polygon.coordinates])
    expect(effectiveDeliveryZones([b, a])[0]!.polygon.coordinates).toEqual([b.polygon.coordinates])
  })
})
