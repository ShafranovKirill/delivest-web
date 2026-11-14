<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AutoComplete, { type AutoCompleteOptionSelectEvent } from 'primevue/autocomplete'
import FloatLabel from 'primevue/floatlabel'
import { useAddressSuggestions } from '../../composables/useAddressSuggestions'
import type { GeoAddress } from '../../api/geo.service'
import { shortAddressLabel } from '../../utils/deliveryAddress'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  value: string
  label: string
  suggest: boolean
  floatingLabels?: boolean
}>()
const emit = defineEmits<{ select: [address: GeoAddress]; edit: [value: string] }>()
const { t } = useI18n()

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
        append-to="self"
        :model-value="query"
        :suggestions="options"
        option-label="label"
        :input-id="inputId"
        :delay="0"
        :min-length="4"
        :empty-search-message="t('delivery.addressNotFound')"
        :empty-selection-message="t('delivery.addressNotFound')"
        :pt="{ overlay: { class: 'address-suggest-overlay' } }"
        input-class="h-12! border-gray-200! bg-gray-50! px-4! pt-5! pb-1! text-base! focus:bg-white!"
        fluid
        @update:model-value="onInput"
        @complete="suggest && search($event.query)"
        @option-select="onSelect"
      >
        <template #empty
          ><span class="block px-3 py-2 text-sm text-gray-700"
            >{{ t('delivery.addressNotFound')
            }}<span class="block text-xs text-gray-500">{{
              t('delivery.addressNotFoundHint')
            }}</span></span
          ></template
        >
      </AutoComplete>
      <label :for="inputId" class="left-4!">{{ label }}</label>
    </FloatLabel>
    <AutoComplete
      v-else
      append-to="self"
      :model-value="query"
      :suggestions="options"
      option-label="label"
      :input-id="inputId"
      :delay="0"
      :min-length="4"
      :empty-search-message="t('delivery.addressNotFound')"
      :empty-selection-message="t('delivery.addressNotFound')"
      :pt="{ overlay: { class: 'address-suggest-overlay' } }"
      input-class="h-12! border-gray-200! bg-gray-50! px-4! text-base! focus:bg-white!"
      fluid
      @update:model-value="onInput"
      @complete="suggest && search($event.query)"
      @option-select="onSelect"
    >
      <template #empty
        ><span class="block px-3 py-2 text-sm text-gray-700"
          >{{ t('delivery.addressNotFound')
          }}<span class="block text-xs text-gray-500">{{
            t('delivery.addressNotFoundHint')
          }}</span></span
        ></template
      >
    </AutoComplete>
  </div>
</template>

<style scoped>
:deep(.p-autocomplete) {
  display: block;
  width: 100%;
}
:deep(.address-suggest-overlay) {
  position: static !important;
  inset: auto !important;
  transform: none !important;
  width: 100% !important;
  max-width: 100%;
  margin-top: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.08);
  overflow: hidden;
}
:deep(.address-suggest-overlay .p-autocomplete-list-container) {
  max-height: 12rem !important;
  overflow-y: auto;
}
:deep(.address-suggest-overlay .p-autocomplete-option) {
  padding: 0.625rem 0.75rem;
  white-space: normal;
  line-height: 1.35;
}
</style>
