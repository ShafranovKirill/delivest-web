<script setup lang="ts">
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import { useContactsStore } from '../stores/constacts.store'
import ContactList from '../components/ContactList.vue'
import { useI18n } from 'vue-i18n'

const contactsStore = useContactsStore()
const { t } = useI18n()
</script>

<template>
  <PageShell :title="t('nav.contacts')" :subtitle="contactsStore.cafeName" width="narrow">
    <ContactList />
  </PageShell>
</template>
