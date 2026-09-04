<script setup lang="ts">
import { useContactsStore } from '../contacts/stores/constacts.store'
import { useSidebarStore } from '../sidebar/sidebar.store'

const sidebarStore = useSidebarStore()
const contactStore = useContactsStore()
</script>
<template>
  <header class="w-full bg-gray-200 border-solid">
    <Toolbar class="rounded-none! max-w-7xl mx-auto bg-gray-200! border-0!">
      <template #start>
        <Button icon="pi pi-bars" class="mr-4" @click="sidebarStore.toggleSidebar"></Button>

        <div class="tracking-widest text-4xl font-bold text-(--p-primary-500)">Olivia</div>
      </template>

      <template #end>
        <div class="flex gap-2">
          <Button
            icon="pi pi-phone"
            variant="text"
            class="font-light!"
            @click="contactStore.openModal"
          />

          <CartButtonDesktop class="hidden! md:block!" />
        </div>
      </template>
    </Toolbar>
  </header>
</template>
