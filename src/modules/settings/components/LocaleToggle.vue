<script setup lang="ts">
import { useLocaleStore } from '../stores/locale.store'
import { LOCALE_NAMES } from '@/i18n'
import { useI18n } from 'vue-i18n'

const localeStore = useLocaleStore()
const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-1.5 cursor-pointer transition-colors"
    :aria-label="t('settings.language')"
    :title="t('settings.language')"
    @click="localeStore.toggle"
  >
    <i class="pi pi-globe" />
    <span>{{ LOCALE_NAMES[localeStore.locale] }}</span>
  </button>
</template>
