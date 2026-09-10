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
    <template #header>
      <h2 class="font-bold text-xl">Контакты</h2>
    </template>

    <template #default>
      <div class="w-full flex flex-col gap-2">
        <div v-if="contactsStore.phone" class="flex gap-2">
          <Button
            :label="contactsStore.phoneFormatted"
            icon="pi pi-phone"
            @click="contactsStore.makeCall"
            class="w-full!"
          />
          <Button icon="pi pi-clone" @click="handleCopy" />
        </div>

        <Button
          v-if="contactsStore.social.instagram"
          class="w-full!"
          icon="pi pi-instagram"
          label="Instagram"
          @click="openLink(contactsStore.social.instagram)"
        />

        <Button
          v-if="contactsStore.social.vk"
          class="w-full!"
          label="ВКонтакте"
          @click="openLink(contactsStore.social.vk)"
        >
          <template #icon>
            <i-vk-logo-white class="w-4 h-4 mr-2" />
          </template>
        </Button>

        <Button
          v-if="contactsStore.social.whatsapp"
          class="w-full!"
          icon="pi pi-whatsapp"
          label="WhatsApp"
          @click="openLink(contactsStore.social.whatsapp)"
        />

        <div
          v-if="
            !contactsStore.phone &&
            !contactsStore.social.vk &&
            !contactsStore.social.instagram &&
            !contactsStore.social.whatsapp
          "
          class="text-center text-gray-500 py-4"
        >
          У данного филиала нет указанных контактов
        </div>
      </div>
    </template>
  </Dialog>
</template>
