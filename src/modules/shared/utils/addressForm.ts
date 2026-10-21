import type { AddressForm } from '../components/AddressFields.vue'

type NullableAddress = { [K in keyof AddressForm]?: string | null }

export function emptyAddressForm(): AddressForm {
  return { street: '', house: '', apartment: '', entrance: '', floor: '', intercom: '' }
}

export function toAddressForm(address: NullableAddress): AddressForm {
  return {
    street: address.street ?? '',
    house: address.house ?? '',
    apartment: address.apartment ?? '',
    entrance: address.entrance ?? '',
    floor: address.floor ?? '',
    intercom: address.intercom ?? '',
  }
}

export function toAddressPayload(form: AddressForm): Required<NullableAddress> {
  return {
    street: form.street.trim() || null,
    house: form.house.trim() || null,
    apartment: form.apartment.trim() || null,
    entrance: form.entrance.trim() || null,
    floor: form.floor.trim() || null,
    intercom: form.intercom.trim() || null,
  }
}
