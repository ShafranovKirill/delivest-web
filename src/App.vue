<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import { useThemeStore } from '@/modules/settings/stores/theme.store'
import { useLocaleStore } from '@/modules/settings/stores/locale.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useBrandColor } from '@/modules/franchise/composables/useBrandColor'
import AppToast from '@/modules/shared/components/ui/AppToast.vue'

useThemeStore()
useBrandColor()
const localeStore = useLocaleStore()
const franchiseStore = useFranchiseStore()

useHead({
  title: computed(() => franchiseStore.name),
  htmlAttrs: { lang: computed(() => localeStore.locale) },
})
</script>

<template>
  <AppToast />
  <RouterView />
</template>
