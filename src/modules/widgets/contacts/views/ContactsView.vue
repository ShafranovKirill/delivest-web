<script setup lang="ts">
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
import { useContactsStore } from '../stores/constacts.store'
import ContactList from '../components/ContactList.vue'
import ContactPlaceCard from '../components/ContactPlaceCard.vue'
import ContactEmailCard from '../components/ContactEmailCard.vue'
import ContactRequisitesCard from '../components/ContactRequisitesCard.vue'
import { useI18n } from 'vue-i18n'

const contactsStore = useContactsStore()
const { t } = useI18n()
</script>

<template>
  <PageShell :title="t('nav.contacts')" :subtitle="contactsStore.cafeName">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">
      <div class="flex flex-col gap-3 sm:gap-4">
        <SurfaceCard icon="pi-comments" :label="t('contacts.reach')">
          <template #value>{{ t('contacts.reachHint') }}</template>
          <ContactList />
        </SurfaceCard>
        <ContactEmailCard />
      </div>

      <ContactPlaceCard />
      <ContactRequisitesCard class="md:col-span-2" />
    </div>
  </PageShell>
</template>
