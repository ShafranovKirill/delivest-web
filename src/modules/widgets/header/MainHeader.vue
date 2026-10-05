<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import CartButtonDesktop from '@/modules/cart/components/CartButtonDesktop.vue'
import { useContactsStore } from '../contacts/stores/constacts.store'
import { useSidebarStore } from '../sidebar/sidebar.store'
import { getCafeName } from '@/utils/env'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useMobileModalStore } from '../modal/mobile-modal/stores/modal.store'
import MobileBranchHeaderInfo from '@/modules/branch/components/MobileBranchHeaderInfo.vue'
import BranchInfoBar from '@/modules/branch/components/BranchInfoBar.vue'

const router = useRouter()
const sidebarStore = useSidebarStore()
const contactStore = useContactsStore()
const viewportStore = useViewportStore()
const branchStore = useBranchStore()
const modalStore = useMobileModalStore()
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
  <header class="w-full bg-gray-200 h-15 sticky top-0 z-50">
    <Toolbar
      class="rounded-none! max-w-7xl mx-auto px-3! lg:px-4! py-0! h-full bg-gray-200! border-0!"
    >
      <template #start>
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <template v-if="modalStore.isOpen">
            <Button
              icon="pi pi-times text-3xl!"
              variant="text"
              class="p-1! text-gray-700 hover:text-black shrink-0"
              aria-label="Закрыть"
              @click="modalStore.closeModal"
            />

            <div class="h-6 w-px bg-gray-400 shrink-0" />
          </template>

          <div
            translate="no"
            class="text-3xl sm:text-4xl px-0.5 tracking-tighter text-(--p-primary-500) cursor-pointer select-none hover:opacity-80 transition-opacity shrink-0"
            style="font-family: 'Unbounded', sans-serif; font-weight: 500"
            @click="navigateToMenu"
          >
            {{ cafeName }}
          </div>
          <BranchInfoBar v-if="branchStore.activeBranch && !viewportStore.isMobile" />
        </div>
      </template>

      <template #center>
        <MobileBranchHeaderInfo
          v-if="branchStore.activeBranch && viewportStore.isMobile && !modalStore.isOpen"
        />
      </template>

      <template #end>
        <div class="flex items-center sm:gap-2 shrink-0">
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
