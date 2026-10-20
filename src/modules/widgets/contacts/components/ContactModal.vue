<script setup lang="ts">
import { useContactsStore } from '../stores/constacts.store'
import ContactList from './ContactList.vue'

const contactsStore = useContactsStore()
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
        <h2 class="text-xl font-extrabold text-gray-950">Контакты</h2>
        <p v-if="contactsStore.cafeName" class="text-sm text-gray-500">
          {{ contactsStore.cafeName }}
        </p>
      </div>
    </template>

    <ContactList />
  </Dialog>
</template>
