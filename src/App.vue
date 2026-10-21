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

const ogImage = `${window.location.origin}/delivest-logo/logo-white.png`

useHead({
  title: computed(() => franchiseStore.name),
  htmlAttrs: { lang: computed(() => localeStore.locale) },
  meta: [
    { name: 'description', content: computed(() => franchiseStore.description) },
    { property: 'og:title', content: computed(() => franchiseStore.name) },
    { property: 'og:description', content: computed(() => franchiseStore.description) },
    { property: 'og:image', content: ogImage },
    { property: 'og:type', content: 'website' },
  ],
})
</script>

<template>
  <AppToast />
  <RouterView />
</template>
