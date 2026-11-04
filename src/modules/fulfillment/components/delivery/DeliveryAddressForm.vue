<script setup lang="ts">
import { ref, watch } from 'vue'
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
  const city = isCity ? parts.shift()! : branchCity
  let line = parts.join(', ')
  if (!isCity && branchCity && line.toLowerCase().startsWith(`${branchCity.toLowerCase()} `)) {
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

const details = ['entrance', 'intercom', 'floor', 'apartment'] as const
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="text-sm font-medium text-gray-700">{{ t('fulfillment.form.streetHouse') }}</label>
    <AddressSuggestInput
      :value="inputValue"
      :city="city"
      :suggest="suggest"
      :placeholder="t('fulfillment.form.fullAddress')"
      @select="selectAddress"
      @edit="editAddress"
    />
    <div class="grid grid-cols-2 gap-2">
      <label
        v-for="field in details"
        :key="field"
        class="flex min-w-0 flex-col gap-1 text-xs text-gray-600"
      >
        {{ t(`fulfillment.form.${field}`) }}
        <InputText
          v-model="address[field]"
          :placeholder="t(`fulfillment.form.${field}`)"
          class="w-full min-w-0"
        />
      </label>
    </div>
  </div>
</template>
