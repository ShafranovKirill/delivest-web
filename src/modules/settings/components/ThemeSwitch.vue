<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import SegmentedSwitch from './SegmentedSwitch.vue'
import { useThemeStore, type ThemeMode } from '../stores/theme.store'
import { useI18n } from 'vue-i18n'

const { mode } = storeToRefs(useThemeStore())
const { t } = useI18n()

const options = computed<Array<{ value: ThemeMode; label: string; icon: string }>>(() => [
  { value: 'light', label: t('settings.themes.light'), icon: 'pi-sun' },
  { value: 'dark', label: t('settings.themes.dark'), icon: 'pi-moon' },
  { value: 'auto', label: t('settings.themes.auto'), icon: 'pi-desktop' },
])
</script>

<template>
  <SegmentedSwitch v-model="mode" :label="t('settings.theme')" :options="options" />
</template>
