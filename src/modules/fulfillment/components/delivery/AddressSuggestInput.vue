<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AutoComplete, { type AutoCompleteOptionSelectEvent } from 'primevue/autocomplete'
import { useAddressSuggestions } from '../../composables/useAddressSuggestions'
import type { GeoAddress } from '../../api/geo.service'
import { shortAddressLabel } from '../../utils/deliveryAddress'

const props = defineProps<{
  value: string
  label: string
  suggest: boolean
}>()
const emit = defineEmits<{ select: [address: GeoAddress]; edit: [value: string] }>()

const inputId = useId()
const query = ref(props.value)
const { suggestions, search } = useAddressSuggestions()
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
  <div class="flex flex-col gap-2">
    <label :for="inputId" class="px-1 text-xs font-medium text-gray-500">{{ label }}</label>
    <AutoComplete
      append-to="self"
      :model-value="query"
      :suggestions="options"
      option-label="label"
      :input-id="inputId"
      :delay="0"
      :min-length="4"
      input-class="h-12! border-gray-200! bg-gray-50! px-4! text-base! focus:bg-white!"
      fluid
      @update:model-value="onInput"
      @complete="suggest && search($event.query)"
      @option-select="onSelect"
    />
  </div>
</template>
