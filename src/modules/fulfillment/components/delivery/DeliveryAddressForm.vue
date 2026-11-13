<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddressSuggestInput from './AddressSuggestInput.vue'
import InputText from 'primevue/inputtext'
import type { GeoAddress } from '../../api/geo.service'
import { shortAddressLabel, type DeliveryAddress } from '../../utils/deliveryAddress'

const props = defineProps<{ suggest: boolean; city: string | null }>()
const emit = defineEmits<{ select: [address: GeoAddress] }>()
const address = defineModel<DeliveryAddress>({ required: true })
const { t } = useI18n()

function addressText(value: DeliveryAddress) {
  if (!value.street && !value.house && !value.geo) return ''
  return shortAddressLabel(value, value.geo?.formatted)
}

const inputValue = ref(addressText(address.value))
let editing = false
watch(
  address,
  (value) => {
    if (editing) {
      editing = false
      return
    }
    inputValue.value = addressText(value)
  },
  { deep: true },
)

function editAddress(value: string) {
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const first = parts[0] ?? ''
  const second = parts[1] ?? ''
  const branchCity = props.city || address.value.city
  const isCity =
    first.toLowerCase() === branchCity.toLowerCase() ||
    /^г\.?(?:\s|$)/i.test(first) ||
    (parts.length >= 3 && !/^(ул\.?|улица|пр\.?|проспект|пер\.?|переулок|шоссе)/i.test(first)) ||
    (parts.length === 2 && /[а-яa-z].*\d/i.test(second) && !/^д(?:ом)?\.?\s*\d/i.test(second))
  let city = isCity ? parts.shift()! : ''
  let line = parts.join(', ')
  if (!isCity && branchCity && line.toLowerCase().startsWith(`${branchCity.toLowerCase()} `)) {
    city = branchCity
    line = line.slice(branchCity.length).trim()
  }
  const houseMatch = line.match(
    /(?:^|[\s,])(?:д(?:ом)?\.?\s*)?(\d+[а-яa-z]?(?:[/-]\d+[а-яa-z]?)?(?:\s+(?:к|корпус|стр)\.?\s*\d+)?)\s*$/i,
  )
  const house = houseMatch?.[1] ?? ''
  const street = houseMatch ? line.slice(0, houseMatch.index).replace(/[\s,]+$/, '') : line

  editing = true
  address.value = {
    ...address.value,
    city,
    street,
    house,
    geo: null,
    latitude: null,
    longitude: null,
  }
}

function selectAddress(value: GeoAddress) {
  editing = false
  inputValue.value = shortAddressLabel(value, value.value)
  emit('select', value)
}

const detailsId = useId()
const details = ['entrance', 'intercom', 'floor', 'apartment'] as const
</script>

<template>
  <div class="flex flex-col gap-4">
    <AddressSuggestInput
      :value="inputValue"
      :suggest="suggest"
      :label="t('fulfillment.form.fullAddress')"
      @select="selectAddress"
      @edit="editAddress"
    />
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div v-for="field in details" :key="field" class="flex min-w-0 flex-col gap-2">
        <label :for="`${detailsId}-${field}`" class="px-1 text-xs font-medium text-gray-500">
          {{ t(`fulfillment.form.${field}`) }}
        </label>
        <InputText
          :id="`${detailsId}-${field}`"
          v-model="address[field]"
          class="h-12! w-full min-w-0 border-gray-200! bg-gray-50! px-4! text-base! focus:bg-white!"
        />
      </div>
    </div>
  </div>
</template>
