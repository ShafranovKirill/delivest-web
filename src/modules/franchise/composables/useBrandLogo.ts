import { computed } from 'vue'
import { useFranchiseStore } from '../stores/franchise.store'
import { useThemeStore } from '@/modules/settings/stores/theme.store'

export function useBrandLogo() {
  const franchiseStore = useFranchiseStore()
  const themeStore = useThemeStore()

  return computed(() =>
    themeStore.isDark
      ? (franchiseStore.logoDarkUrl ?? franchiseStore.logoUrl)
      : franchiseStore.logoUrl,
  )
}
