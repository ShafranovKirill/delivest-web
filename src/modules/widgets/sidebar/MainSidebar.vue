<script setup lang="ts">
import { ref } from 'vue'
import { useSidebarStore } from './sidebar.store'
import BranchInfoBarMobile from '@/modules/branch/components/BranchInfoBarMobile.vue'
import { useRouter } from 'vue-router'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useContactsStore } from '../contacts/stores/constacts.store'

const sidebarStore = useSidebarStore()
const router = useRouter()
const branchStore = useBranchStore()
const contactStore = useContactsStore()

const navigateTo = (routeName: string) => {
  sidebarStore.isSidebarVisible = false
  if (branchStore.activeBranch?.slug) {
    router.push({
      name: routeName,
      params: { slug: branchStore.activeBranch.slug },
    })
  }
}

const items = ref([
  {
    label: 'Меню',
    icon: 'pi pi-list',
    command: () => navigateTo('menu'),
  },
  {
    label: 'Акции',
    icon: 'pi pi-percentage',
    command: () => navigateTo('promotions'),
  },
  {
    label: 'О нас',
    icon: 'pi pi-info-circle',
    command: () => navigateTo('branch-info'),
  },
  {
    label: 'Контакты',
    icon: 'pi pi-phone',
    command: () => {
      contactStore.openModal()
      sidebarStore.isSidebarVisible = false
    },
  },
])
</script>

<template>
  <Drawer v-model:visible="sidebarStore.isSidebarVisible">
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
  </Drawer>
</template>
