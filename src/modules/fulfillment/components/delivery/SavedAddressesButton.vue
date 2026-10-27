<script setup lang="ts">
import { computed, ref } from 'vue'
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import { useI18n } from 'vue-i18n'
import type { ClientAddress } from '@/modules/account/api/account.service'
import { formatAddress } from '@/modules/shared/utils/address'
import { useCityAddresses } from '../../composables/useCityAddresses'

const props = defineProps<{ city: string | null }>()
const emit = defineEmits<{ select: [address: ClientAddress] }>()

const { t } = useI18n()
const menu = ref<InstanceType<typeof Menu> | null>(null)
const addresses = useCityAddresses(() => props.city)

const items = computed<MenuItem[]>(() =>
  addresses.value.map((address) => ({
    label: formatAddress(address),
    icon: 'pi pi-history',
    command: () => emit('select', address),
  })),
)
</script>

<template>
  <template v-if="addresses.length">
    <button
      type="button"
      class="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-gray-700 shadow-lg ring-1 ring-black/10 hover:bg-gray-50 dark:ring-white/10 cursor-pointer"
      @click="menu?.toggle($event)"
    >
      <i class="pi pi-bookmark" />
      {{ t('fulfillment.savedAddresses') }}
    </button>
    <Menu ref="menu" :model="items" popup class="max-w-80" />
  </template>
</template>
