export interface AddressParts {
  street?: string | null
  house?: string | null
  apartment?: string | null
  entrance?: string | null
  floor?: string | null
}

export function formatAddress(address: AddressParts | null | undefined): string {
  if (!address) return ''

  return [
    address.street,
    address.house && `д. ${address.house}`,
    address.apartment && `кв. ${address.apartment}`,
    address.entrance && `подъезд ${address.entrance}`,
    address.floor && `этаж ${address.floor}`,
  ]
    .filter(Boolean)
    .join(', ')
}
