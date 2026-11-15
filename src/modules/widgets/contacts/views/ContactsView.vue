<script setup lang="ts">
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import PageIllustration from '@/modules/shared/components/ui/PageIllustration.vue'
import { useContactsStore } from '../stores/constacts.store'
import ContactList from '../components/ContactList.vue'
import ContactPlaceCard from '../components/ContactPlaceCard.vue'
import ContactEmailCard from '../components/ContactEmailCard.vue'
import ContactRequisitesCard from '../components/ContactRequisitesCard.vue'
import ContactSectionHeader from '../components/ContactSectionHeader.vue'
import { useI18n } from 'vue-i18n'

const contactsStore = useContactsStore()
const { t } = useI18n()
</script>

<template>
  <PageShell :title="t('nav.contacts')" :subtitle="contactsStore.cafeName">
    <template #illustration>
      <PageIllustration kind="contacts" />
    </template>
    <div class="grid items-start gap-4 md:grid-cols-2 md:gap-5">
      <section
        class="min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white"
        :aria-label="t('contacts.reach')"
      >
        <ContactSectionHeader :title="t('contacts.reach')" kind="reach" />
        <div class="px-5 pb-5 sm:px-6">
          <ContactList variant="directory" />
          <ContactEmailCard />
        </div>
      </section>

      <section
        class="min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white"
        :aria-label="t('contacts.place')"
      >
        <ContactSectionHeader :title="t('contacts.place')" kind="place" />
        <div class="px-5 pb-5 sm:px-6">
          <ContactPlaceCard />
        </div>
      </section>

      <ContactRequisitesCard class="mt-6 md:col-span-2 md:mt-7" />
    </div>
  </PageShell>
</template>
