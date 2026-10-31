<script setup lang="ts">
import { ref, watch } from 'vue'
import ResponsiveSheet from '@/modules/shared/components/ui/ResponsiveSheet.vue'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../stores/auth.store'
import { useCallConfirmation } from '../composables/useCallConfirmation'
import type { ClientSession } from '../api/auth.service'
import AuthPhoneStep from './AuthPhoneStep.vue'
import AuthCallStep from './AuthCallStep.vue'
import AuthFlashStep from './AuthFlashStep.vue'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const toast = useToast()
const { t } = useI18n()
const phone = ref('')

function onConfirmed(session: ClientSession) {
  authStore.signIn(session)
  authStore.closeModal()
  toast.add({
    severity: 'success',
    summary: t('auth.signedIn'),
    detail: t('auth.phoneConfirmed'),
    life: 3000,
  })
}

const {
  confirmation,
  isStarting,
  isChecking,
  errorMessage,
  secondsLeft,
  attemptsLeft,
  start,
  submitCode,
  reset,
} = useCallConfirmation(onConfirmed)

function submitPhone(value: string) {
  phone.value = value
  start(value)
}

watch(
  () => authStore.isModalOpen,
  (open) => !open && reset(),
)
</script>

<template>
  <ResponsiveSheet v-model:visible="authStore.isModalOpen">
    <template #header>
      <div>
        <h2 class="text-xl font-extrabold text-gray-950">
          {{ confirmation ? t('auth.confirmTitle') : t('auth.signInTitle') }}
        </h2>
      </div>
    </template>

    <Message v-if="errorMessage" severity="error" class="mb-4 rounded-2xl!" :closable="false">
      {{ errorMessage }}
    </Message>

    <AuthFlashStep
      v-if="confirmation?.mode === 'flash'"
      :phone="phone"
      :seconds-left="secondsLeft"
      :attempts-left="attemptsLeft"
      :checking="isChecking"
      @submit="submitCode"
      @back="reset()"
    />
    <AuthCallStep
      v-else-if="confirmation?.call_number"
      :call-number="confirmation.call_number"
      :phone="phone"
      :seconds-left="secondsLeft"
      @back="reset()"
    />
    <AuthPhoneStep v-else :loading="isStarting" @submit="submitPhone" />
  </ResponsiveSheet>
</template>
