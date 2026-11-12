<script setup lang="ts">
import { computed } from 'vue'
import { useFulfillmentStore } from '../stores/fulfillment.store'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useFulfillmentFlowStore } from '../stores/fulfillmentFlow.store'

const { t } = useI18n()
const viewportStore = useViewportStore()
const authStore = useAuthStore()
const branchStore = useBranchStore()
const flowStore = useFulfillmentFlowStore()
const fulfillment = useFulfillmentStore()
const title = computed(() => {
  if (!fulfillment.canOrder) return t('fulfillment.prompt.unavailable')
  return t(branchStore.mapAddress ? 'fulfillment.prompt.title' : 'fulfillment.prompt.methodTitle')
})
</script>

<template>
  <Dialog
    v-model:visible="flowStore.isPromptOpen"
    modal
    dismissable-mask
    :position="viewportStore.isMobile ? 'bottom' : 'center'"
    :header="title"
    class="w-full max-w-md"
    @hide="flowStore.dismiss"
  >
    <p v-if="branchStore.mapAddress || !fulfillment.canOrder" class="text-gray-600">
      {{
        t(fulfillment.canOrder ? 'fulfillment.prompt.text' : 'errors.codes.fulfillment_unavailable')
      }}
    </p>

    <div class="mt-5 flex flex-col gap-2">
      <Button
        v-if="fulfillment.availableModes.includes('delivery')"
        :label="t(branchStore.mapAddress ? 'fulfillment.prompt.delivery' : 'order.form.delivery')"
        class="h-12 rounded-full! font-semibold"
        @click="flowStore.openPicker('delivery')"
      />
      <Button
        v-if="fulfillment.availableModes.includes('pickup')"
        :label="
          t(
            fulfillment.methods.includes('pickup')
              ? 'fulfillment.prompt.pickup'
              : 'order.form.dineIn',
          )
        "
        severity="secondary"
        class="h-12 rounded-full! font-semibold"
        @click="flowStore.openPicker('pickup')"
      />
    </div>

    <p
      v-if="authStore.isEnabled && !authStore.isAuthenticated"
      class="mt-4 text-center text-sm text-gray-500"
    >
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
