<script setup lang="ts">
import { useAuthStore } from '../stores/auth.store'

const authStore = useAuthStore()
function open() {
  if (authStore.isAuthenticated) authStore.openProfile()
  else authStore.openModal()
}
</script>

<template>
  <slot v-if="authStore.isEnabled" :open="open" :signed-in="authStore.isAuthenticated" />
</template>
