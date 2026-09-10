<script setup lang="ts">
import { ref } from 'vue'
import { useSidebarStore } from './sidebar.store'
import BranchInfoBarMobile from '@/modules/branch/components/BranchInfoBarMobile.vue'

const sidebarStore = useSidebarStore()

const items = ref([
  {
    label: 'Меню',
    icon: 'pi pi-list',
  },
  {
    label: 'Акции',
    icon: 'pi pi-percentage',
  },
  {
    label: 'О нас',
    icon: 'pi pi-info-circle',
  },
  {
    label: 'Контакты',
    icon: 'pi pi-phone',
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
            'flex items-center gap-3 py-2.5 text-base font-medium text-gray-800 rounded-lg hover:bg-gray-100 transition-colors',
        },
      }"
    />
  </Drawer>
</template>
