<script setup lang="ts">
import { storeToRefs } from 'pinia'
import SegmentedSwitch from './SegmentedSwitch.vue'
import { useThemeStore, type ThemeMode } from '../stores/theme.store'

const { mode } = storeToRefs(useThemeStore())

const options: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'light', label: 'Светлая', icon: 'pi-sun' },
  { value: 'dark', label: 'Тёмная', icon: 'pi-moon' },
  { value: 'auto', label: 'Авто', icon: 'pi-desktop' },
]
</script>

<template>
  <SegmentedSwitch v-model="mode" label="Тема" :options="options" />
</template>
