import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { FranchiseService, type Franchise } from '../api/franchise.service'

export const useFranchiseStore = defineStore(
  'franchise',
  () => {
    const franchise = ref<Franchise | null>(null)

    const name = computed(() => franchise.value?.name ?? '')
    const description = computed(() => franchise.value?.description ?? '')
    const primaryColor = computed(() => franchise.value?.primary_color ?? null)
    const darkPrimaryColor = computed(() => franchise.value?.dark_primary_color ?? null)
    const legal = computed(() => franchise.value?.legal ?? null)
    const logoUrl = computed(() => franchise.value?.logo_url ?? null)
    const logoDarkUrl = computed(() => franchise.value?.logo_dark_url ?? null)
    const addressMap = computed(() => franchise.value?.address_map ?? false)
    const clientAuth = computed(() => franchise.value?.client_auth ?? true)

    async function load() {
      try {
        franchise.value = await FranchiseService.getFranchise()
      } catch (error) {
        console.error('[FranchiseStore] Failed to load franchise settings:', error)
      }
    }

    async function init() {
      const request = load()
      if (!franchise.value) await request
    }

    return {
      franchise,
      name,
      description,
      primaryColor,
      darkPrimaryColor,
      legal,
      logoUrl,
      logoDarkUrl,
      addressMap,
      clientAuth,
      init,
    }
  },
  { persist: { pick: ['franchise'] } },
)
