<script setup lang="ts">
import { ref, watch } from 'vue'
import AutoComplete, { type AutoCompleteOptionSelectEvent } from 'primevue/autocomplete'
import { useAddressSuggestions } from '../../composables/useAddressSuggestions'
import type { GeoAddress } from '../../api/geo.service'

const props = defineProps<{ value: string; city: string | null; placeholder: string }>()
const emit = defineEmits<{ select: [address: GeoAddress]; edit: [] }>()

const query = ref(props.value)
const { suggestions, search } = useAddressSuggestions(() => props.city)

watch(
  () => props.value,
  (value) => {
    if (value) query.value = value
  },
)

function onInput(value: unknown) {
  if (typeof value !== 'string') return
  query.value = value
  emit('edit')
}

function onSelect({ value }: AutoCompleteOptionSelectEvent) {
  const address = value as GeoAddress
  if (address.house) {
    query.value = address.value
    emit('select', address)
  } else {
    query.value = `${address.value}, `
  }
}
</script>

<template>
  <AutoComplete
    :model-value="query"
    :suggestions="suggestions"
    option-label="value"
    :placeholder="placeholder"
    :delay="0"
    :min-length="4"
    fluid
    @update:model-value="onInput"
    @complete="search($event.query)"
    @option-select="onSelect"
  />
</template>
