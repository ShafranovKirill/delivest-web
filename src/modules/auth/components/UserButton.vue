<script setup lang="ts">
import Button from 'primevue/button'
import AccountMenu from './AccountMenu.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <AccountMenu v-slot="{ open, signedIn }">
    <Button
      icon="pi pi-user text-xl!"
      variant="text"
      :class="{ 'text-primary!': signedIn }"
      :aria-label="signedIn ? t('auth.profile') : t('auth.signIn')"
      @click="open"
    />
  </AccountMenu>
</template>
