<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import { getCafeName, getSiteDescription } from '@/utils/env'
import { useThemeStore } from '@/modules/settings/stores/theme.store'
import { useLocaleStore } from '@/modules/settings/stores/locale.store'
import AppToast from '@/modules/shared/components/ui/AppToast.vue'

useThemeStore()
const localeStore = useLocaleStore()

const cafeName = getCafeName()
const siteDescription = getSiteDescription()
const ogImage = `${window.location.origin}/delivest-logo/logo-white.png`

useHead({
  title: cafeName,
  htmlAttrs: { lang: computed(() => localeStore.locale) },
  meta: [
    { name: 'description', content: siteDescription },
    { property: 'og:title', content: cafeName },
    { property: 'og:description', content: siteDescription },
    { property: 'og:image', content: ogImage },
    { property: 'og:type', content: 'website' },
  ],
})
</script>

<template>
  <AppToast />
  <RouterView />
</template>
