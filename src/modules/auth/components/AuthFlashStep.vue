<script setup lang="ts">
import { computed, ref } from 'vue'
import InputOtp from 'primevue/inputotp'
import { formatPhoneNumber } from '@/modules/widgets/contacts/utils/tel-format'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  phone: string
  secondsLeft: number
  attemptsLeft: number | null
  checking: boolean
}>()
const emit = defineEmits<{ submit: [code: string]; back: [] }>()

const { t } = useI18n()
const code = ref('')

const timeLeft = computed(() => {
  const minutes = Math.floor(props.secondsLeft / 60)
  const seconds = String(props.secondsLeft % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})

function onUpdate(value: string | number | undefined) {
  code.value = String(value ?? '')
  if (code.value.length === 4) {
    emit('submit', code.value)
    code.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <i18n-t keypath="auth.flash.instruction" tag="p" class="text-sm text-gray-500">
      <template #phone>
        <span class="font-semibold text-gray-900 whitespace-nowrap">{{
          formatPhoneNumber(phone)
        }}</span>
      </template>
    </i18n-t>

    <div class="flex justify-center">
      <InputOtp
        :model-value="code"
        :length="4"
        integer-only
        :disabled="checking"
        auto-focus
        @update:model-value="onUpdate"
      />
    </div>

    <p v-if="attemptsLeft !== null" class="text-center text-sm font-semibold text-red-600">
      {{ t('auth.flash.wrong', { left: attemptsLeft }) }}
    </p>

    <div class="flex items-center justify-center gap-2 text-sm text-gray-500">
      <i class="pi pi-spin pi-spinner text-primary" />
      <span>{{ t('auth.flash.waiting', { time: timeLeft }) }}</span>
    </div>

    <button
      type="button"
      class="text-sm font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer"
      @click="$emit('back')"
    >
      {{ t('auth.call.changeNumber') }}
    </button>
  </div>
</template>
