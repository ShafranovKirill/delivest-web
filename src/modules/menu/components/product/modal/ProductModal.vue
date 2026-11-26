<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import DesktopProductModal from './DesktopProductModal.vue'
import MobileProductModal from './MobileProductModal.vue'
import { computed } from 'vue'
import { useMenuStore } from '@/modules/menu/stores/menu.store.ts'

const menuStore = useMenuStore()
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
</script>

<template>
  <component
    :is="isMobile ? MobileProductModal : DesktopProductModal"
    v-model:visible="menuStore.isProductModalOpen"
  />
</template>
