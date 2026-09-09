<script setup lang="ts">
import CartButtonDesktop from '@/modules/cart/components/CartButtonDesktop.vue'
import { useContactsStore } from '../contacts/stores/constacts.store'
import { useSidebarStore } from '../sidebar/sidebar.store'
import { getCafeName } from '@/utils/env'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store.ts'
import BranchInfoBar from '@/modules/branch/components/BranchInfoBar.vue'

const sidebarStore = useSidebarStore()
const contactStore = useContactsStore()
const viewportStore = useViewportStore()
const branchStore = useBranchStore()
const cafeName = getCafeName()
</script>

<template>
  <header class="w-full bg-gray-200 border-solid h-15 sticky top-0 z-50">
    <Toolbar class="rounded-none! max-w-7xl mx-auto px-4! py-0! h-full bg-gray-200! border-0!">
      <template #start>
        <div class="flex items-center gap-3">
          <Button
            icon="pi pi-bars"
            @click="sidebarStore.toggleSidebar"
            v-if="viewportStore.isMobile"
          ></Button>

          <div class="tracking-widest text-4xl font-bold text-(--p-primary-500)">
            {{ cafeName }}
          </div>

          <BranchInfoBar v-if="branchStore.activeBranch && !viewportStore.isMobile" />
        </div>
      </template>

      <template #end>
        <div class="flex gap-2">
          <Button icon="pi pi-phone text-lg!" variant="text" @click="contactStore.openModal" />

          <CartButtonDesktop v-if="!viewportStore.isMobile" />
        </div>
      </template>
    </Toolbar>
  </header>
</template>
