<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '../stores/theme.store'
import { useI18n } from 'vue-i18n'

defineProps<{ labeled?: boolean }>()

const themeStore = useThemeStore()
const { t } = useI18n()

const icon = computed(() => (themeStore.isDark ? 'pi-moon' : 'pi-sun'))
const label = computed(() =>
  themeStore.isDark ? t('settings.themes.dark') : t('settings.themes.light'),
)
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-1.5 cursor-pointer transition-colors"
    :aria-label="t('settings.theme')"
    :title="t('settings.theme')"
    @click="themeStore.toggle"
  >
    <i :class="['pi', icon]" />
    <span v-if="labeled">{{ label }}</span>
  </button>
</template>
