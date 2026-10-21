<script setup lang="ts">
import Button from 'primevue/button'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'
import { useAuthStore } from '../stores/auth.store'
import { useI18n } from 'vue-i18n'

defineProps<{ text: string }>()

const authStore = useAuthStore()
const { t } = useI18n()
</script>

<template>
  <slot v-if="authStore.isAuthenticated" />
  <EmptyState v-else icon="pi-user" :title="t('auth.required')" :text="text">
    <Button :label="t('auth.signIn')" icon="pi pi-sign-in" rounded @click="authStore.openModal" />
  </EmptyState>
</template>
