import { watch } from 'vue'
import { useFranchiseStore } from '../stores/franchise.store'
import { applyBrandColor } from '../utils/brandColor'

export function useBrandColor() {
  const franchiseStore = useFranchiseStore()

  watch(
    () => [franchiseStore.primaryColor, franchiseStore.darkPrimaryColor] as const,
    ([color, darkColor]) => color && applyBrandColor(color, darkColor),
    { immediate: true },
  )
}
