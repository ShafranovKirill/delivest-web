<script setup lang="ts">
import { useContactsStore } from '../stores/constacts.store'
import ContactList from './ContactList.vue'
import { useI18n } from 'vue-i18n'

const contactsStore = useContactsStore()
const { t } = useI18n()
</script>

<template>
  <Dialog
    v-model:visible="contactsStore.isModalOpen"
    modal
    :dismissableMask="true"
    :draggable="false"
    class="w-[min(92vw,420px)]"
    :pt="{ root: { class: 'rounded-4xl! overflow-hidden' } }"
  >
    <template #header>
      <div>
        <h2 class="text-xl font-extrabold text-gray-950">{{ t('nav.contacts') }}</h2>
        <p v-if="contactsStore.cafeName" class="text-sm text-gray-500">
          {{ contactsStore.cafeName }}
        </p>
      </div>
    </template>

    <ContactList />
  </Dialog>
</template>
