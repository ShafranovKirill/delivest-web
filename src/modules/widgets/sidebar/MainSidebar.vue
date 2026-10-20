<script setup lang="ts">
import { computed } from 'vue'
import { useSidebarStore } from './sidebar.store'
import BranchInfoBarMobile from '@/modules/branch/components/BranchInfoBarMobile.vue'
import ThemeSwitch from '@/modules/settings/components/ThemeSwitch.vue'
import LocaleSwitch from '@/modules/settings/components/LocaleSwitch.vue'
import { useRouter } from 'vue-router'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import SidebarUserPanel from '@/modules/auth/components/SidebarUserPanel.vue'
import { useI18n } from 'vue-i18n'

const sidebarStore = useSidebarStore()
const router = useRouter()
const branchStore = useBranchStore()
const { t } = useI18n()

const navigateTo = (routeName: string) => {
  sidebarStore.isSidebarVisible = false
  if (branchStore.activeBranch?.slug) {
    router.push({
      name: routeName,
      params: { slug: branchStore.activeBranch.slug },
    })
  }
}

const items = computed(() => [
  {
    label: t('nav.menu'),
    icon: 'pi pi-list',
    command: () => navigateTo('menu'),
  },
  {
    label: t('nav.promotions'),
    icon: 'pi pi-percentage',
    command: () => navigateTo('promotions'),
  },
  {
    label: t('nav.about'),
    icon: 'pi pi-info-circle',
    command: () => navigateTo('branch-info'),
  },
  {
    label: t('nav.contacts'),
    icon: 'pi pi-phone',
    command: () => navigateTo('contacts'),
  },
])
</script>

<template>
  <Drawer v-model:visible="sidebarStore.isSidebarVisible">
    <SidebarUserPanel class="mb-5" />

    <BranchInfoBarMobile />

    <Menu
      :model="items"
      unstyled
      class="mt-6 flex flex-col gap-1 w-full"
      :pt="{
        itemLink: {
          class:
            'flex items-center gap-3 py-2.5 text-base font-medium text-gray-800 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer',
        },
      }"
    />

    <div class="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-6">
      <ThemeSwitch />
      <LocaleSwitch />
    </div>
  </Drawer>
</template>
