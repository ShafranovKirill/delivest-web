import { watch } from 'vue'
import { useFranchiseStore } from '../stores/franchise.store'
import { applyBrandColor } from '../utils/brandColor'

export function useBrandColor() {
  const franchiseStore = useFranchiseStore()

  watch(
    () => franchiseStore.primaryColor,
    (color) => color && applyBrandColor(color),
    { immediate: true },
  )
}
