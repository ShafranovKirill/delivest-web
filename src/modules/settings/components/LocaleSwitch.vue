<script setup lang="ts">
import { storeToRefs } from 'pinia'
import SegmentedSwitch from './SegmentedSwitch.vue'
import { useLocaleStore } from '../stores/locale.store'
import { LOCALES, LOCALE_NAMES } from '@/i18n'
import { useI18n } from 'vue-i18n'

const { locale } = storeToRefs(useLocaleStore())
const { t } = useI18n()

const options = LOCALES.map((value) => ({ value, label: LOCALE_NAMES[value] }))
</script>

<template>
  <SegmentedSwitch v-model="locale" :label="t('settings.language')" :options="options" />
</template>
