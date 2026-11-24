<script setup lang="ts">
import { computed } from 'vue'
import { useFulfillmentStore } from '../stores/fulfillment.store'
import ResponsiveSheet from '@/modules/shared/components/ui/ResponsiveSheet.vue'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useFulfillmentFlowStore } from '../stores/fulfillmentFlow.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'

const { t } = useI18n()
const authStore = useAuthStore()
const flowStore = useFulfillmentFlowStore()
const fulfillment = useFulfillmentStore()
const branchStore = useBranchStore()
const title = computed(() => {
  if (!fulfillment.canOrder) return t('fulfillment.prompt.unavailable')
  return t(branchStore.mapAddress ? 'fulfillment.prompt.title' : 'fulfillment.prompt.methodTitle')
})
</script>

<template>
  <ResponsiveSheet
    v-model:visible="flowStore.isPromptOpen"
    :header="title"
    desktop-class="w-full max-w-md"
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
  </ResponsiveSheet>
</template>
