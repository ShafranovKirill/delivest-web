<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFranchiseStore } from '../stores/franchise.store'
import { useBrandLogo } from '../composables/useBrandLogo'
import { hasFailedBrandLogo, markBrandLogoFailed } from '../utils/brandLogoPreload'

const props = defineProps<{ fallback?: string }>()

const franchiseStore = useFranchiseStore()
const logo = useBrandLogo()
const failed = ref(false)

watch(logo, () => (failed.value = false))

const name = computed(() => franchiseStore.name || props.fallback || '')
const showImage = computed(() => Boolean(logo.value) && !failed.value && !hasFailedBrandLogo(logo.value!))

function onError() {
  if (logo.value) markBrandLogoFailed(logo.value)
  failed.value = true
}
</script>

<template>
  <span translate="no" class="inline-flex max-w-full min-w-0 items-center select-none">
    <img
      v-if="showImage"
      :src="logo!"
      :alt="name"
      decoding="async"
      loading="eager"
      fetchpriority="high"
      class="h-full w-auto max-w-full object-contain object-left"
      @error="onError"
    />
    <span v-else class="font-brand font-medium tracking-tighter text-primary truncate">
      {{ name }}
    </span>
  </span>
</template>
