<script setup lang="ts">
import { computed } from 'vue'
import InputText from 'primevue/inputtext'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  required?: boolean
  class?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function formatDisplayPhone(rawDigits: string): string {
  let digits = rawDigits.replace(/\D/g, '')

  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1)
  }
  if (!digits.startsWith('7')) {
    digits = '7' + digits
  }
  digits = digits.slice(0, 11)

  let formatted = '+7'
  if (digits.length > 1) {
    formatted += ' (' + digits.slice(1, 4)
  }
  if (digits.length >= 5) {
    formatted += ') ' + digits.slice(4, 7)
  }
  if (digits.length >= 8) {
    formatted += '-' + digits.slice(7, 9)
  }
  if (digits.length >= 10) {
    formatted += '-' + digits.slice(9, 11)
  }

  return formatted
}

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
    @input="handleInput"
    :placeholder="placeholder || '+7 (999) 000-00-00'"
    :required="required"
  />
</template>
