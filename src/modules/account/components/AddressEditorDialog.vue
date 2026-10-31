<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { getApiErrorMessage } from '@/api/errors'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import MapDialog from '@/modules/fulfillment/components/MapDialog.vue'
import PaneSkeleton from '@/modules/fulfillment/components/PaneSkeleton.vue'
import { loadAddressEditor } from '@/modules/fulfillment/utils/panes'
import {
  emptyDeliveryAddress,
  fromClientAddress,
  toAddressPayload,
  type DeliveryAddress,
} from '@/modules/fulfillment/utils/deliveryAddress'
import type { ClientAddress } from '../api/account.service'
import { useAddressMutations } from '../composables/useAddressMutations'

const AddressEditor = defineAsyncComponent({
  loader: loadAddressEditor,
  loadingComponent: PaneSkeleton,
  delay: 0,
})

const props = defineProps<{ address: ClientAddress | null; visible: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const toast = useToast()
const branchStore = useBranchStore()
const { save } = useAddressMutations()

const city = computed(() => branchStore.activeBranch?.branch_info?.city ?? null)
const draft = ref<DeliveryAddress>(emptyDeliveryAddress())
const label = ref('')

const isOpen = computed({
  get: () => props.visible,
  set: (value) => !value && emit('close'),
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    draft.value = props.address
      ? fromClientAddress(props.address)
      : emptyDeliveryAddress(city.value ?? '')
    label.value = props.address?.label ?? ''
  },
  { immediate: true },
)

async function submit() {
  const payload = { ...toAddressPayload(draft.value), label: label.value.trim() || null }

  try {
    await save.mutateAsync({ id: props.address?.id ?? null, payload })
    emit('close')
  } catch (error) {
    toast.add({ severity: 'error', summary: getApiErrorMessage(error), life: 3000 })
  }
}
</script>

<template>
  <MapDialog v-model:visible="isOpen">
    <template #header>
      <p
        class="grid h-11 place-items-center rounded-full bg-white px-4 font-semibold text-gray-900 shadow-lg ring-1 ring-black/10 dark:ring-white/10"
      >
        {{ address ? t('account.address.editTitle') : t('account.address.newTitle') }}
      </p>
    </template>

    <AddressEditor v-model="draft" :city="city" :saved="false">
      <template #before>
        <InputText
          v-model="label"
          :placeholder="t('account.address.label')"
          maxlength="30"
          class="w-full"
        />
      </template>

      <template #default="{ ready, locating }">
        <Textarea
          v-model="draft.comment"
          :placeholder="t('fulfillment.form.comment')"
          :aria-label="t('fulfillment.form.comment')"
          maxlength="255"
          rows="2"
          auto-resize
          class="w-full"
        />
        <Button
          :label="t('common.save')"
          :disabled="!ready"
          :loading="locating || save.isPending.value"
          class="h-12 w-full rounded-full! font-semibold"
          @click="submit"
        />
      </template>
    </AddressEditor>
  </MapDialog>
</template>
