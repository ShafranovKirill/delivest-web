import { t } from '@/i18n'

export interface AddressParts {
  street?: string | null
  house?: string | null
  block?: string | null
  building?: string | null
  apartment?: string | null
  entrance?: string | null
  floor?: string | null
}

export function formatAddress(address: AddressParts | null | undefined): string {
  if (!address) return ''

  return [
    address.street,
    address.house &&
      t('address.short.house', {
        value: [
          address.house,
          address.block && t('address.short.block', { value: address.block }),
          address.building && t('address.short.building', { value: address.building }),
        ]
          .filter(Boolean)
          .join(' '),
      }),
    address.apartment && t('address.short.apartment', { value: address.apartment }),
    address.entrance && t('address.short.entrance', { value: address.entrance }),
    address.floor && t('address.short.floor', { value: address.floor }),
  ]
    .filter(Boolean)
    .join(', ')
}
