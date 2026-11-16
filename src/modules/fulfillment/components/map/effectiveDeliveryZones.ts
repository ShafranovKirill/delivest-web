import * as polygonClipping from 'polygon-clipping'
import type { Polygon, MultiPolygon } from 'polygon-clipping'
import type { DeliveryZone } from '../../api/delivery.service'

export type EffectiveDeliveryZone = Omit<DeliveryZone, 'polygon'> & {
  polygon: { type: 'MultiPolygon'; coordinates: MultiPolygon }
}

// The API order is the priority order. Copy coordinates because clipping may normalize rings.
export function effectiveDeliveryZones(zones: DeliveryZone[]): EffectiveDeliveryZone[] {
  const higher: Polygon[] = []
  const effective: EffectiveDeliveryZone[] = []

  for (const zone of zones) {
    const polygon = zone.polygon.coordinates.map((ring) =>
      ring.map(([longitude, latitude]) => [longitude, latitude] as [number, number]),
    )
    if (!polygon[0]?.length) continue

    const visible = higher.length ? polygonClipping.difference(polygon, ...higher) : [polygon]
    if (visible.length) {
      effective.push({ ...zone, polygon: { type: 'MultiPolygon', coordinates: visible } })
    }
    higher.push(polygon)
  }

  return effective
}
