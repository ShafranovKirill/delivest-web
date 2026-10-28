<script setup lang="ts">
import { computed } from 'vue'
import { useSidebarStore } from './sidebar.store'
import SidebarNav from './SidebarNav.vue'
import BranchInfoBarMobile from '@/modules/branch/components/BranchInfoBarMobile.vue'
import SidebarUserPanel from '@/modules/auth/components/SidebarUserPanel.vue'
import InstallAppTile from '@/modules/pwa/components/InstallAppTile.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useAccountLinks } from '@/modules/auth/composables/useAccountLinks'
import ThemeToggle from '@/modules/settings/components/ThemeToggle.vue'
import LocaleToggle from '@/modules/settings/components/LocaleToggle.vue'
import BrandLogo from '@/modules/franchise/components/BrandLogo.vue'
import PoweredByDelivest from '@/modules/widgets/powered-by/PoweredByDelivest.vue'
import { useI18n } from 'vue-i18n'

const sidebarStore = useSidebarStore()
const authStore = useAuthStore()
const accountLinks = useAccountLinks()
const { t } = useI18n()

const mainLinks = computed(() => [
  { route: 'menu', label: t('nav.menu'), icon: 'pi pi-list' },
  { route: 'promotions', label: t('nav.promotions'), icon: 'pi pi-percentage' },
  { route: 'branch-info', label: t('nav.about'), icon: 'pi pi-info-circle' },
  { route: 'contacts', label: t('nav.contacts'), icon: 'pi pi-phone' },
])

const settingClass =
  'flex-1 justify-center rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200/60'
</script>

<template>
  <Drawer
    v-model:visible="sidebarStore.isSidebarVisible"
    :pt="{ content: { class: 'flex flex-col gap-6 pb-5' } }"
  >
    <template #header>
      <BrandLogo class="h-8 max-w-48 text-2xl" />
    </template>

    <div class="flex flex-col gap-2">
      <SidebarUserPanel />
      <BranchInfoBarMobile />
      <InstallAppTile />
    </div>

    <SidebarNav :items="mainLinks" />

    <SidebarNav v-if="authStore.isAuthenticated" :title="t('nav.account')" :items="accountLinks" />

    <div class="mt-auto flex flex-col items-center gap-4">
      <div class="flex w-full gap-2">
        <ThemeToggle labeled :class="settingClass" />
        <LocaleToggle :class="settingClass" />
      </div>
      <PoweredByDelivest />
    </div>
  </Drawer>
</template>
