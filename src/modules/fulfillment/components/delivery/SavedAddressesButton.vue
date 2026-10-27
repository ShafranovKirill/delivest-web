<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import type { ClientAddress } from '@/modules/account/api/account.service'
import { formatAddress } from '@/modules/shared/utils/address'
import { useCityAddresses } from '../../composables/useCityAddresses'

const props = defineProps<{ city: string | null }>()
const emit = defineEmits<{ select: [address: ClientAddress] }>()

const { t } = useI18n()
const root = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const addresses = useCityAddresses(() => props.city)

onClickOutside(root, () => (isOpen.value = false))

function select(address: ClientAddress) {
  isOpen.value = false
  emit('select', address)
}
</script>

<template>
  <div v-if="addresses.length" ref="root">
    <ul
      v-if="isOpen"
      class="absolute bottom-full left-0 mb-2 flex max-h-64 w-72 max-w-[calc(100vw-1.5rem)] flex-col overflow-y-auto rounded-2xl bg-white p-1 shadow-lg ring-1 ring-black/10 dark:ring-white/10"
    >
      <li v-for="address in addresses" :key="address.id">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          @click="select(address)"
        >
          <i class="pi text-gray-400" :class="address.label ? 'pi-home' : 'pi-history'" />
          <span class="min-w-0 flex-1">
            <span v-if="address.label" class="block text-gray-950">{{ address.label }}</span>
            <span class="block" :class="{ 'text-xs font-normal text-gray-500': address.label }">
              {{ formatAddress(address) }}
            </span>
          </span>
        </button>
      </li>
    </ul>

    <button
      type="button"
      :aria-expanded="isOpen"
      class="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-gray-700 shadow-lg ring-1 ring-black/10 hover:bg-gray-50 dark:ring-white/10 cursor-pointer"
      @click="isOpen = !isOpen"
    >
      <i class="pi pi-bookmark" />
      {{ t('fulfillment.savedAddresses') }}
    </button>
  </div>
</template>
