<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import FloatLabel from 'primevue/floatlabel'
import AutoComplete, { type AutoCompleteOptionSelectEvent } from 'primevue/autocomplete'
import { useAddressSuggestions } from '../../composables/useAddressSuggestions'
import type { GeoAddress } from '../../api/geo.service'
import { shortAddressLabel } from '../../utils/deliveryAddress'

const props = defineProps<{
  value: string
  city: string | null
  label: string
  suggest: boolean
}>()
const emit = defineEmits<{ select: [address: GeoAddress]; edit: [value: string] }>()

const inputId = useId()
const query = ref(props.value)
const { suggestions, search } = useAddressSuggestions(() => {
  const prefix = props.city && `${props.city},`.toLowerCase()
  return prefix && query.value.trimStart().toLowerCase().startsWith(prefix) ? props.city : null
})
const options = computed(() =>
  suggestions.value.map((address) => ({
    address,
    label: shortAddressLabel(address, address.value),
  })),
)

watch(
  () => props.value,
  (value) => {
    query.value = value
  },
)

function onInput(value: unknown) {
  if (typeof value !== 'string') return
  query.value = value
  emit('edit', value)
}

function onSelect({ value }: AutoCompleteOptionSelectEvent) {
  const { address, label } = value as { address: GeoAddress; label: string }
  if (address.house) {
    query.value = label
    emit('select', address)
  } else {
    query.value = `${label}, `
    emit('edit', query.value)
  }
}
</script>

<template>
  <FloatLabel variant="in">
    <AutoComplete
      :model-value="query"
      :suggestions="options"
      option-label="label"
      :input-id="inputId"
      :delay="0"
      :min-length="4"
      fluid
      @update:model-value="onInput"
      @complete="suggest && search($event.query)"
      @option-select="onSelect"
    />
    <label :for="inputId">{{ label }}</label>
  </FloatLabel>
</template>
