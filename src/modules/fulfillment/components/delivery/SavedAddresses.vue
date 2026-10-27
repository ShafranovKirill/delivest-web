<script setup lang="ts">
import type { ClientAddress } from '@/modules/account/api/account.service'
import { formatAddress } from '@/modules/shared/utils/address'
import { useCityAddresses } from '../../composables/useCityAddresses'

const props = defineProps<{ city: string | null }>()
defineEmits<{ select: [address: ClientAddress] }>()

const addresses = useCityAddresses(() => props.city)
</script>

<template>
  <div v-if="addresses.length" class="flex gap-2 overflow-x-auto pb-1">
    <button
      v-for="address in addresses"
      :key="address.id"
      type="button"
      class="flex shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-primary transition-colors cursor-pointer max-w-64"
      @click="$emit('select', address)"
    >
      <i class="pi" :class="address.label ? 'pi-home' : 'pi-history'" />
      <span class="truncate">{{ address.label || formatAddress(address) }}</span>
    </button>
  </div>
</template>
