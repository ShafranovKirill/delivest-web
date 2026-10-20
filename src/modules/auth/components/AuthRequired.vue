<script setup lang="ts">
import Button from 'primevue/button'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'
import { useAuthStore } from '../stores/auth.store'

defineProps<{ text: string }>()

const authStore = useAuthStore()
</script>

<template>
  <slot v-if="authStore.isAuthenticated" />
  <EmptyState v-else icon="pi-user" title="Войдите в аккаунт" :text="text">
    <Button label="Войти" icon="pi pi-sign-in" rounded @click="authStore.openModal" />
  </EmptyState>
</template>
