<script setup lang="ts">
import { useAddressesQuery } from '@/modules/account/composables/useAddressesQuery'
import type { ClientAddress } from '@/modules/account/api/account.service'
import { formatAddress } from '@/modules/shared/utils/address'
import type { AddressForm } from '@/modules/shared/components/AddressFields.vue'
import { toAddressForm } from '@/modules/shared/utils/addressForm'

const props = defineProps<{ current: AddressForm }>()
defineEmits<{ select: [address: ClientAddress] }>()

const { data: addresses } = useAddressesQuery()

function isSelected(address: ClientAddress) {
  const form = toAddressForm(address)
  return (Object.keys(form) as (keyof AddressForm)[]).every(
    (key) => form[key] === props.current[key].trim(),
  )
}
</script>

<template>
  <div v-if="addresses?.length" class="flex flex-col gap-1.5">
    <span class="text-sm font-medium text-gray-600">Мои адреса</span>
    <div class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="address in addresses"
        :key="address.id"
        type="button"
        class="flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors cursor-pointer max-w-64"
        :class="
          isSelected(address)
            ? 'border-primary bg-primary-soft text-primary'
            : 'border-gray-200 bg-white text-gray-700 hover:border-primary'
        "
        @click="$emit('select', address)"
      >
        <i class="pi pi-map-marker" />
        <span class="truncate">{{ formatAddress(address) }}</span>
      </button>
    </div>
  </div>
</template>
