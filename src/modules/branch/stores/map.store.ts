import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useBranchStore } from './branch.store'
import { getYandexMapsApiKey } from '@/utils/env' // Путь к вашему файлу с env-утилитами

type YmapsInstance = typeof window.ymaps

export const useMapStore = defineStore('yandexMap', () => {
  const branchStore = useBranchStore()

  const isLoaded = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const loadError = ref<string | null>(null)

  const isMapEnabled = computed<boolean>(() => {
    return branchStore.activeBranch?.branch_info?.ycart_settings?.enabled ?? false
  })

  const mapSettings = computed(() => {
    return branchStore.activeBranch?.branch_info?.ycart_settings ?? null
  })

  const coordinates = computed<[number, number] | null>(() => {
    const settings = mapSettings.value
    if (!settings || !settings.latitude || !settings.longitude) return null
    return [settings.latitude, settings.longitude]
  })

  const yandexOrgUrl = computed<string | null>(() => {
    const orgId = mapSettings.value?.yandex_org_id
    if (!orgId) return null
    return `https://yandex.ru/maps/org/${orgId}`
  })

  async function initYandexMapScript(): Promise<YmapsInstance> {
    if (window.ymaps) {
      isLoaded.value = true
      return window.ymaps
    }

    if (isLoading.value) {
      return new Promise<YmapsInstance>((resolve) => {
        const checkInterval = setInterval(() => {
          if (window.ymaps) {
            clearInterval(checkInterval)
            isLoaded.value = true
            resolve(window.ymaps)
          }
        }, 100)
      })
    }

    isLoading.value = true
    loadError.value = null

    return new Promise<YmapsInstance>((resolve, reject) => {
      const apiKey = getYandexMapsApiKey()
      const script = document.createElement('script')
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`
      script.async = true

      script.onload = () => {
        if (window.ymaps) {
          window.ymaps.ready(() => {
            isLoading.value = false
            isLoaded.value = true
            resolve(window.ymaps)
          })
        } else {
          isLoading.value = false
          loadError.value = 'Объект ymaps не найден после загрузки скрипта'
          reject(new Error(loadError.value))
        }
      }

      script.onerror = (err) => {
        isLoading.value = false
        loadError.value = 'Не удалось загрузить скрипт Яндекс Карт'
        reject(err)
      }

      document.head.appendChild(script)
    })
  }

  return {
    isLoaded,
    isLoading,
    loadError,
    isMapEnabled,
    mapSettings,
    coordinates,
    yandexOrgUrl,
    initYandexMapScript,
  }
})
