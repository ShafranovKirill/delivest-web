<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../stores/auth.store'
import { useCallConfirmation } from '../composables/useCallConfirmation'
import type { ClientSession } from '../api/auth.service'
import AuthPhoneStep from './AuthPhoneStep.vue'
import AuthCallStep from './AuthCallStep.vue'
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

const { confirmation, isStarting, errorMessage, secondsLeft, start, reset } =
  useCallConfirmation(onConfirmed)

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
  <Dialog
    v-model:visible="authStore.isModalOpen"
    modal
    dismissable-mask
    :draggable="false"
    class="w-[min(92vw,420px)]"
    :pt="{ root: { class: 'rounded-4xl! overflow-hidden' } }"
  >
    <template #header>
      <div>
        <h2 class="text-xl font-extrabold text-gray-950">
          {{ confirmation ? t('auth.confirmTitle') : t('auth.signInTitle') }}
        </h2>
        <p class="text-sm text-gray-500">{{ t('auth.subtitle') }}</p>
      </div>
    </template>

    <Message v-if="errorMessage" severity="error" class="mb-4 rounded-2xl!" :closable="false">
      {{ errorMessage }}
    </Message>

    <AuthCallStep
      v-if="confirmation"
      :call-number="confirmation.call_number"
      :phone="phone"
      :seconds-left="secondsLeft"
      @back="reset()"
    />
    <AuthPhoneStep v-else :loading="isStarting" @submit="submitPhone" />
  </Dialog>
</template>
