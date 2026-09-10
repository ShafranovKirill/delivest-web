<script setup lang="ts">
import { useRouter } from 'vue-router'
import CartButtonDesktop from '@/modules/cart/components/CartButtonDesktop.vue'
import { useContactsStore } from '../contacts/stores/constacts.store'
import { useSidebarStore } from '../sidebar/sidebar.store'
import { getCafeName } from '@/utils/env'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import BranchInfoBar from '@/modules/branch/components/BranchInfoBar.vue'

const router = useRouter()
const sidebarStore = useSidebarStore()
const contactStore = useContactsStore()
const viewportStore = useViewportStore()
const branchStore = useBranchStore()
const cafeName = getCafeName()

const navigateToMenu = () => {
  sidebarStore.isSidebarVisible = false
  if (branchStore.activeBranch?.slug) {
    router.push({
      name: 'menu',
      params: { slug: branchStore.activeBranch.slug },
    })
  }
}
</script>

<template>
  <header class="w-full bg-gray-200 border-solid h-15 sticky top-0 z-50">
    <Toolbar class="rounded-none! max-w-7xl mx-auto px-4! py-0! h-full bg-gray-200! border-0!">
      <template #start>
        <div class="flex items-center gap-3">
          <div
            class="tracking-widest text-4xl font-bold text-(--p-primary-500) cursor-pointer select-none hover:opacity-80 transition-opacity"
            @click="navigateToMenu"
          >
            {{ cafeName }}
          </div>

          <BranchInfoBar v-if="branchStore.activeBranch && !viewportStore.isMobile" />
        </div>
      </template>

      <template #end>
        <div class="flex items-center sm:gap-2">
          <Button icon="pi pi-phone text-xl!" variant="text" @click="contactStore.openModal" />

          <CartButtonDesktop v-if="!viewportStore.isMobile" />

          <Button
            v-if="viewportStore.isMobile"
            icon="pi pi-bars text-3xl!"
            variant="text"
            class="p-2!"
            @click="sidebarStore.toggleSidebar"
          />
        </div>
      </template>
    </Toolbar>
  </header>
</template>
