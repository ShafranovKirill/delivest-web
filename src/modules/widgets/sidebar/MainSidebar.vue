<script setup lang="ts">
import { ref } from 'vue'
import { useSidebarStore } from './sidebar.store'

const sidebarStore = useSidebarStore()

const items = ref([
  {
    label: 'Меню',
    icon: 'pi pi-list',
  },
])
</script>
<template>
  <Sidebar v-model:visible="sidebarStore.isSidebarVisible">
    <Menu :model="items"></Menu>
  </Sidebar>
</template>
