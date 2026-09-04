<script setup lang="ts">
import CartButtonDesktop from '@/modules/cart/components/CartButtonDesktop.vue'
import { useContactsStore } from '../contacts/stores/constacts.store'
import { useSidebarStore } from '../sidebar/sidebar.store'
import { getCafeName } from '@/utils/env'

const sidebarStore = useSidebarStore()
const contactStore = useContactsStore()
const cafeName = getCafeName()
</script>
<template>
  <header class="w-full bg-gray-200 border-solid">
    <Toolbar class="rounded-none! max-w-7xl mx-auto bg-gray-200! border-0!">
      <template #start>
        <Button icon="pi pi-bars" class="mr-4" @click="sidebarStore.toggleSidebar"></Button>

        <div class="tracking-widest text-4xl font-bold text-(--p-primary-500)">{{ cafeName }}</div>
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
