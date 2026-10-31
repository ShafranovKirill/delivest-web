<script setup lang="ts">
import { formatAddress } from '@/modules/shared/utils/address'
import type { ClientAddress } from '../api/account.service'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{ address: ClientAddress }>()
defineEmits<{ edit: [address: ClientAddress]; remove: [address: ClientAddress] }>()
</script>

<template>
  <div
    class="group flex items-center gap-3 rounded-3xl bg-gray-50 border border-gray-100 p-3 hover:border-primary transition-colors"
  >
    <button
      type="button"
      class="flex flex-1 items-center gap-3 min-w-0 text-left cursor-pointer"
      @click="$emit('edit', address)"
    >
      <span
        class="grid place-items-center size-11 shrink-0 rounded-2xl bg-white text-primary shadow-xs"
      >
        <i class="pi" :class="address.label ? 'pi-home' : 'pi-map-marker'" />
      </span>
      <span class="min-w-0">
        <span v-if="address.label" class="block font-bold text-gray-900 truncate">
          {{ address.label }}
        </span>
        <span
          class="block truncate"
          :class="address.label ? 'text-sm text-gray-500' : 'font-bold text-gray-900'"
        >
          {{ formatAddress(address) }}
        </span>
        <span v-if="address.intercom" class="block text-sm text-gray-500">
          {{ t('account.address.intercom', { value: address.intercom }) }}
        </span>
        <span
          v-if="address.comment"
          class="mt-1 block whitespace-pre-line break-words text-sm text-gray-500"
        >
          {{ address.comment }}
        </span>
      </span>
    </button>
    <button
      type="button"
      class="grid place-items-center size-10 shrink-0 rounded-full bg-white text-gray-400 shadow-xs hover:text-red-500 transition-colors cursor-pointer"
      :aria-label="t('account.address.remove')"
      @click="$emit('remove', address)"
    >
      <i class="pi pi-trash" />
    </button>
  </div>
</template>
