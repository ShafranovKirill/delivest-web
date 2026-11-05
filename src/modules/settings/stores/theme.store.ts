import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { useColorMode, useStorage } from '@vueuse/core'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const THEME_STORAGE_KEY = 'delivest-theme'

export const useThemeStore = defineStore('theme', () => {
  const franchiseStore = useFranchiseStore()
  const preference = useStorage<ThemeMode | null>(THEME_STORAGE_KEY, null, undefined, {
    writeDefaults: false,
  })
  const colorMode = useColorMode({
    storageKey: null,
    initialValue: 'light',
    disableTransition: true,
  })

  watch(
    [preference, () => franchiseStore.defaultTheme],
    ([selected, defaultTheme]) => {
      colorMode.store.value =
        selected === 'light' || selected === 'dark' || selected === 'auto'
          ? selected
          : defaultTheme
    },
    { immediate: true, flush: 'sync' },
  )

  const mode = computed<ThemeMode>({
    get: () => colorMode.store.value as ThemeMode,
    set: (value) => (preference.value = value),
  })

  const isDark = computed(() => colorMode.state.value === 'dark')

  function toggle() {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  return { mode, isDark, toggle }
})
