<script setup lang="ts">
import ResponsiveSheet from '@/modules/shared/components/ui/ResponsiveSheet.vue'
import { useContactsStore } from '../stores/constacts.store'
import ContactList from './ContactList.vue'
import { useI18n } from 'vue-i18n'

const contactsStore = useContactsStore()
const { t } = useI18n()
</script>

<template>
  <ResponsiveSheet
    :aria-label="t('nav.contacts')"
    v-model:visible="contactsStore.isModalOpen"
    desktop-class="w-[min(92vw,420px)]"
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
  </ResponsiveSheet>
</template>
