<script setup lang="ts">
import { computed } from 'vue'
import InputText from 'primevue/inputtext'
import { formatDisplayPhone } from '@/modules/shared/utils/phoneFormat'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  required?: boolean
  class?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const displayValue = computed(() => {
  return formatDisplayPhone(props.modelValue)
})

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement
  let digits = input.value.replace(/\D/g, '')

  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1)
  }
  if (!digits.startsWith('7')) {
    digits = '7' + digits
  }
  digits = digits.slice(0, 11)

  const cleanFormat = '+' + digits
  emit('update:modelValue', cleanFormat)
}
</script>

<template>
  <InputText
    :value="displayValue"
    :class="props.class"
    type="tel"
    name="phone"
    autocomplete="tel"
    inputmode="tel"
    @input="handleInput"
    :placeholder="placeholder || '+7 (999) 000-00-00'"
    :required="required"
  />
</template>
