import type { ClientAddress } from '@/modules/account/api/account.service'
import { formatAddress } from '@/modules/shared/utils/address'
import type { MapMarker } from '../components/map/BaseMap.vue'

export function savedMarkers(addresses: ClientAddress[]): MapMarker[] {
  return addresses.flatMap(({ id, latitude, longitude, ...address }) =>
    latitude != null && longitude != null
      ? [
          {
            id,
            lngLat: [longitude, latitude],
            active: false,
            icon: 'pi-home',
            title: address.label || formatAddress(address),
          },
        ]
      : [],
  )
}
