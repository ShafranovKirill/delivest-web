import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useBranchStore } from './branch.store'

export const useMapStore = defineStore('branchMap', () => {
  const branchStore = useBranchStore()

  const isMapEnabled = computed<boolean>(() => {
    return branchStore.activeBranch?.branch_info?.ycart_settings?.enabled ?? false
  })

  const mapSettings = computed(() => {
    return branchStore.activeBranch?.branch_info?.ycart_settings ?? null
  })

  const coordinates = computed<[number, number] | null>(() => {
    const info = branchStore.activeBranch?.branch_info
    if (info?.latitude == null || info?.longitude == null) return null
    return [info.longitude, info.latitude]
  })

  const yandexOrgUrl = computed<string | null>(() => {
    const orgId = mapSettings.value?.yandex_org_id
    if (!orgId) return null
    return `https://yandex.ru/maps/org/${orgId}`
  })

  return {
    isMapEnabled,
    mapSettings,
    coordinates,
    yandexOrgUrl,
  }
})
