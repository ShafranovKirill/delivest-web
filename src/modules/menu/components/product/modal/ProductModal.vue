<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import DesktopProductModal from './DesktopProductModal.vue'
import MobileProductModal from './MobileProductModal.vue'
import { computed, nextTick, watch } from 'vue'
import { useMenuStore } from '@/modules/menu/stores/menu.store.ts'
import { useOpenCart } from '@/modules/cart/composables/useOpenCart'

const menuStore = useMenuStore()
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const openCart = useOpenCart()

watch(
  () => menuStore.isProductModalOpen,
  async (open, wasOpen) => {
    if (wasOpen && !open && menuStore.returnToCart) {
      menuStore.returnToCart = false
      await nextTick()
      openCart()
    }
  },
)
</script>

<template>
  <component
    :is="isMobile ? MobileProductModal : DesktopProductModal"
    v-model:visible="menuStore.isProductModalOpen"
  />
</template>
