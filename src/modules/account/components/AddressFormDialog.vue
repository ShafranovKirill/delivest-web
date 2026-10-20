<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { getApiErrorMessage } from '@/api/errors'
import AddressFields from '@/modules/shared/components/AddressFields.vue'
import {
  emptyAddressForm,
  toAddressForm,
  toAddressPayload,
} from '@/modules/shared/utils/addressForm'
import type { ClientAddress } from '../api/account.service'
import { useAddressMutations } from '../composables/useAddressMutations'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{ address: ClientAddress | null; visible: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { save } = useAddressMutations()
const form = ref(emptyAddressForm())

const isOpen = computed({
  get: () => props.visible,
  set: (value) => !value && emit('close'),
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    form.value = props.address ? toAddressForm(props.address) : emptyAddressForm()
    save.reset()
  },
)

async function submit() {
  await save.mutateAsync({ id: props.address?.id ?? null, payload: toAddressPayload(form.value) })
  emit('close')
}
</script>

<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    dismissable-mask
    :draggable="false"
    class="w-[min(92vw,480px)]"
    :pt="{ root: { class: 'rounded-4xl! overflow-hidden' } }"
  >
    <template #header>
      <h2 class="text-xl font-extrabold text-gray-950">
        {{ address ? t('account.address.editTitle') : t('account.address.newTitle') }}
      </h2>
    </template>

    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <Message v-if="save.isError.value" severity="error" class="rounded-2xl!" :closable="false">
        {{ getApiErrorMessage(save.error.value) }}
      </Message>

      <AddressFields v-model="form" />

      <Button
        type="submit"
        :label="t('common.save')"
        icon="pi pi-check"
        :loading="save.isPending.value"
        :disabled="!form.street.trim()"
        class="h-12 w-full rounded-full! font-semibold"
      />
    </form>
  </Dialog>
</template>
