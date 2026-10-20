<script setup lang="ts">
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import { useContactsStore } from '../stores/constacts.store'
import ContactList from '../components/ContactList.vue'

const contactsStore = useContactsStore()
</script>

<template>
  <PageShell title="Контакты" :subtitle="contactsStore.cafeName" width="narrow">
    <ContactList />
  </PageShell>
</template>
