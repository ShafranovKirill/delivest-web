<script setup lang="ts">
import { openLink } from '@/utils/browser'
import { useContactsStore } from '../stores/constacts.store'
import { useToast } from 'primevue'

const contactsStore = useContactsStore()
const toast = useToast()

const handleCopy = async () => {
  const result = await contactsStore.copyPhoneNumber()
  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Скопировано',
      detail: 'Номер телефона скопирован в буфер',
      life: 3000,
    })
  }
}
</script>
<template>
  <Dialog v-model:visible="contactsStore.isModalOpen" modal :dismissableMask="true">
    <template #header><h2 class="font-bold text-xl">Контакты</h2></template>
    <template #default>
      <div class="w-full flex flex-col gap-2">
        <div class="flex gap-2">
          <Button
            :label="contactsStore.contacts.phoneFormatted"
            icon="pi pi-phone"
            @click="contactsStore.makeCall"
            class="w-full!"
          ></Button>
          <Button icon="pi pi-clone" @click="handleCopy"></Button>
        </div>
        <Button
          class="w-full!"
          icon="pi pi-instagram"
          label="Instagram"
          @click="openLink(contactsStore.contacts.social.instagram)"
        />
        <Button
          class="w-full!"
          label="ВКонтакте"
          @click="openLink(contactsStore.contacts.social.vk)"
          ><template #icon> <i-vk-logo-white class="w-4 h-4" /> </template
        ></Button>
      </div>
    </template>
  </Dialog>
</template>
