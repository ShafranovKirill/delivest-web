<script setup lang="ts">
import { ref, watch } from 'vue'
import AutoComplete, { type AutoCompleteOptionSelectEvent } from 'primevue/autocomplete'
import { useAddressSuggestions } from '../../composables/useAddressSuggestions'
import type { GeoAddress } from '../../api/geo.service'

const props = defineProps<{ value: string; city: string | null; placeholder: string; suggest: boolean }>()
const emit = defineEmits<{ select: [address: GeoAddress]; edit: [value: string] }>()

const query = ref(props.value)
const { suggestions, search } = useAddressSuggestions(() => {
  const prefix = props.city && `${props.city},`.toLowerCase()
  return prefix && query.value.trimStart().toLowerCase().startsWith(prefix) ? props.city : null
})

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
  const address = value as GeoAddress
  if (address.house) {
    query.value = address.value
    emit('select', address)
  } else {
    query.value = `${address.value}, `
    emit('edit', query.value)
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
    @complete="suggest && search($event.query)"
    @option-select="onSelect"
  />
</template>
