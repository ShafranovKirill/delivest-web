<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { getCafeName, getSiteDescription } from '@/utils/env'

const cafeName = getCafeName()
const siteDescription = getSiteDescription()
const ogImage = `${window.location.origin}/delivest-logo/logo-white.png`

useHead({
  title: cafeName,
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
  <Toast />
  <RouterView />
</template>
