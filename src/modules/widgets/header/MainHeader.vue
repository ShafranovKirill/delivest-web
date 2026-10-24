<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import CartButtonDesktop from '@/modules/cart/components/CartButtonDesktop.vue'
import { useContactsStore } from '../contacts/stores/constacts.store'
import { useSidebarStore } from '../sidebar/sidebar.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useMobileModalStore } from '../modal/mobile-modal/stores/modal.store'
import MobileBranchHeaderInfo from '@/modules/branch/components/MobileBranchHeaderInfo.vue'
import BranchInfoBar from '@/modules/branch/components/BranchInfoBar.vue'
import UserButton from '@/modules/auth/components/UserButton.vue'
import BrandLogo from '@/modules/franchise/components/BrandLogo.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const sidebarStore = useSidebarStore()
const contactStore = useContactsStore()
const viewportStore = useViewportStore()
const branchStore = useBranchStore()
const modalStore = useMobileModalStore()
const franchiseStore = useFranchiseStore()
const { t } = useI18n()

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
      class="rounded-none! max-w-7xl mx-auto px-3! lg:px-4! py-0! h-full bg-gray-200! border-0! flex-nowrap! gap-2"
      :pt="{ center: { class: 'min-w-0 flex-1 flex justify-center' } }"
    >
      <template #start>
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <template v-if="modalStore.isOpen">
            <Button
              icon="pi pi-times text-3xl!"
              variant="text"
              class="p-1! text-gray-700 hover:text-black shrink-0"
              :aria-label="t('common.close')"
              @click="modalStore.closeModal"
            />

            <div class="h-6 w-px bg-gray-400 shrink-0" />
          </template>

          <button
            type="button"
            class="flex h-8 sm:h-10 max-w-40 sm:max-w-56 px-0.5 text-2xl sm:text-4xl cursor-pointer hover:opacity-80 transition-opacity shrink-0"
            :aria-label="franchiseStore.name"
            @click="navigateToMenu"
          >
            <BrandLogo class="h-full" />
          </button>
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
          <Button
            v-if="!viewportStore.isMobile"
            icon="pi pi-phone text-xl!"
            variant="text"
            @click="contactStore.openModal"
          />

          <UserButton v-if="!viewportStore.isMobile" />

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
