<script setup lang="ts">
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import PageIllustration from '@/modules/shared/components/ui/PageIllustration.vue'
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
    <template #illustration>
      <PageIllustration kind="contacts" />
    </template>
    <div class="grid gap-x-12 gap-y-10 md:grid-cols-2 md:gap-y-12">
      <section class="min-w-0" :aria-label="t('contacts.reach')">
        <h2
          class="border-b border-gray-200 pb-3 text-xs font-bold uppercase tracking-widest text-primary-strong"
        >
          {{ t('contacts.reach') }}
        </h2>
        <p class="pt-4 text-sm text-gray-600">{{ t('contacts.reachHint') }}</p>
        <ContactList variant="directory" />
        <ContactEmailCard />
      </section>

      <section class="min-w-0" :aria-label="t('contacts.place')">
        <h2
          class="border-b border-gray-200 pb-3 text-xs font-bold uppercase tracking-widest text-primary-strong"
        >
          {{ t('contacts.place') }}
        </h2>
        <ContactPlaceCard />
      </section>

      <ContactRequisitesCard class="md:col-span-2" />
    </div>
  </PageShell>
</template>
