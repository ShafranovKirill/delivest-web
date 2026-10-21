import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useColorMode } from '@vueuse/core'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const THEME_STORAGE_KEY = 'delivest-theme'

export const useThemeStore = defineStore('theme', () => {
  const colorMode = useColorMode({
    storageKey: THEME_STORAGE_KEY,
    initialValue: 'light',
    disableTransition: true,
  })

  const mode = computed<ThemeMode>({
    get: () => colorMode.store.value as ThemeMode,
    set: (value) => (colorMode.store.value = value),
  })

  const isDark = computed(() => colorMode.state.value === 'dark')

  function toggle() {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  return { mode, isDark, toggle }
})
