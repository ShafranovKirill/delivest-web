<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useFulfillmentFlowStore } from '../stores/fulfillmentFlow.store'

const { t } = useI18n()
const viewportStore = useViewportStore()
const authStore = useAuthStore()
const flowStore = useFulfillmentFlowStore()
</script>

<template>
  <Dialog
    v-model:visible="flowStore.isPromptOpen"
    modal
    dismissable-mask
    :position="viewportStore.isMobile ? 'bottom' : 'center'"
    :header="t('fulfillment.prompt.title')"
    class="w-full max-w-md"
    @hide="flowStore.dismiss"
  >
    <p class="text-gray-600">{{ t('fulfillment.prompt.text') }}</p>

    <div class="mt-5 flex flex-col gap-2">
      <Button
        :label="t('fulfillment.prompt.delivery')"
        class="h-12 rounded-full! font-semibold"
        @click="flowStore.openPicker('delivery')"
      />
      <Button
        :label="t('fulfillment.prompt.pickup')"
        severity="secondary"
        class="h-12 rounded-full! font-semibold"
        @click="flowStore.openPicker('pickup')"
      />
    </div>

    <p v-if="!authStore.isAuthenticated" class="mt-4 text-center text-sm text-gray-500">
      {{ t('fulfillment.prompt.haveAccount') }}
      <button
        type="button"
        class="font-semibold text-primary cursor-pointer"
        @click="flowStore.signIn"
      >
        {{ t('fulfillment.prompt.signIn') }}
      </button>
    </p>
  </Dialog>
</template>
