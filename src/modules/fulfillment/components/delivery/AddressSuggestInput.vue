<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import AutoComplete, { type AutoCompleteOptionSelectEvent } from 'primevue/autocomplete'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import { useAddressSuggestions } from '../../composables/useAddressSuggestions'
import type { GeoAddress } from '../../api/geo.service'
import { shortAddressLabel } from '../../utils/deliveryAddress'
import { useI18n } from 'vue-i18n'
import type { AddressNotice } from './addressNotice'

const props = defineProps<{
  value: string
  label: string
  suggest: boolean
  city: string | null
  floatingLabels?: boolean
}>()
const emit = defineEmits<{
  select: [address: GeoAddress]
  edit: [value: string]
  notice: [notice: AddressNotice | null]
}>()
const { t } = useI18n()

const inputId = useId()
const query = ref(props.value)
const { suggestions, error, loading, hasSearched, search, clear, dispose } = useAddressSuggestions()
type AutocompleteControl = { show: () => void; searching: boolean }
const floatingAutocomplete = ref<AutocompleteControl | null>(null)
const plainAutocomplete = ref<AutocompleteControl | null>(null)
let retryRequested = false
const options = computed(() =>
  suggestions.value.map((address) => ({
    address,
    label: shortAddressLabel(address, address.value),
  })),
)
const notice = computed<AddressNotice | null>(() => {
  if (!props.suggest) return null
  if (error.value) return { message: t('fulfillment.form.suggestionError'), retry }
  if (hasSearched.value && !suggestions.value.length)
    return { message: t('delivery.addressNotFound') }
  return null
})
watch(notice, (value) => emit('notice', value), { immediate: true })

watch(
  () => props.value,
  (value) => {
    query.value = value
    clear()
  },
)

watch(() => props.city, clear)
onBeforeUnmount(dispose)

watch(suggestions, async () => {
  await nextTick()
  const input = document.getElementById(inputId)
  if (
    hasSearched.value &&
    suggestions.value.length > 0 &&
    query.value.trim().length >= 4 &&
    (retryRequested || document.activeElement === input)
  ) {
    ;(props.floatingLabels ? floatingAutocomplete.value : plainAutocomplete.value)?.show()
  }
  if (hasSearched.value) retryRequested = false
})

watch(error, (failed) => {
  if (failed) retryRequested = false
})

function retry() {
  retryRequested = true
  search(query.value, props.city)
}

function onBlur() {
  retryRequested = false
  const autocomplete = props.floatingLabels ? floatingAutocomplete.value : plainAutocomplete.value
  if (autocomplete) autocomplete.searching = false
}

function onInput(value: unknown) {
  if (typeof value !== 'string') return
  retryRequested = false
  query.value = value
  clear()
  emit('edit', value)
}

function onSelect({ value }: AutoCompleteOptionSelectEvent) {
  const { address, label } = value as { address: GeoAddress; label: string }
  if (address.house) {
    query.value = label
    clear()
    emit('select', address)
  } else {
    query.value = `${label}, `
    clear()
    emit('edit', query.value)
  }
}
</script>

<template>
  <div class="flex flex-col" :class="{ 'gap-2': !floatingLabels }">
    <label v-if="!floatingLabels" :for="inputId" class="px-1 text-xs font-medium text-gray-500">{{
      label
    }}</label>
    <FloatLabel
      v-if="floatingLabels"
      variant="in"
      :dt="{ root: { active: { fontSize: '0.6875rem' } }, in: { active: { top: '0.375rem' } } }"
      class="block w-full"
    >
      <AutoComplete
        v-if="suggest"
        ref="floatingAutocomplete"
        append-to="self"
        :loading="loading"
        :model-value="query"
        :suggestions="options"
        option-label="label"
        :input-id="inputId"
        :delay="0"
        :min-length="4"
        :show-empty-message="false"
        :empty-selection-message="t('fulfillment.form.noAddressSelected')"
        :pt="{ overlay: { class: 'address-suggest-overlay' } }"
        input-class="h-12! border-gray-200! bg-gray-50! px-4! pt-5! pb-1! text-base! focus:bg-white! dark:focus:bg-(--surface-card)!"
        fluid
        @update:model-value="onInput"
        @complete="search($event.query, city)"
        @blur="onBlur"
        @option-select="onSelect"
      />
      <InputText
        v-else
        :id="inputId"
        :model-value="query"
        class="h-12! w-full border-gray-200! bg-gray-50! px-4! pt-5! pb-1! text-base! focus:bg-white! dark:focus:bg-(--surface-card)!"
        @update:model-value="onInput"
      />
      <label :for="inputId" class="left-4!">{{ label }}</label>
    </FloatLabel>
    <AutoComplete
      v-else-if="suggest"
      ref="plainAutocomplete"
      append-to="self"
      :loading="loading"
      :model-value="query"
      :suggestions="options"
      option-label="label"
      :input-id="inputId"
      :delay="0"
      :min-length="4"
      :show-empty-message="false"
      :empty-selection-message="t('fulfillment.form.noAddressSelected')"
      :pt="{ overlay: { class: 'address-suggest-overlay' } }"
      input-class="h-12! border-gray-200! bg-gray-50! px-4! text-base! focus:bg-white! dark:focus:bg-(--surface-card)!"
      fluid
      @update:model-value="onInput"
      @complete="search($event.query, city)"
      @blur="onBlur"
      @option-select="onSelect"
    />
    <InputText
      v-else
      :id="inputId"
      :model-value="query"
      class="h-12! w-full border-gray-200! bg-gray-50! px-4! text-base! focus:bg-white! dark:focus:bg-(--surface-card)!"
      @update:model-value="onInput"
    />
  </div>
</template>

<style scoped>
:deep(.p-autocomplete) {
  display: block;
  width: 100%;
}
:global(.address-suggest-overlay) {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.08);
  overflow: hidden;
}
:global(.address-suggest-overlay:not(:has(.p-autocomplete-list [role='option']))) {
  visibility: hidden;
  pointer-events: none;
}
:global(.address-suggest-overlay .p-autocomplete-list-container) {
  max-height: 12rem !important;
  overflow-y: auto;
  scrollbar-width: none;
}
:global(.address-suggest-overlay .p-autocomplete-list-container::-webkit-scrollbar) {
  display: none;
}
:global(.address-suggest-overlay .p-autocomplete-option) {
  padding: 0.625rem 0.75rem;
  white-space: normal;
  line-height: 1.35;
}
</style>
