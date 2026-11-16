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
    const defaultTheme = computed(() =>
      franchise.value?.default_theme === 'dark' ? 'dark' : 'light',
    )
    const legal = computed(() => franchise.value?.legal ?? null)
    const logoUrl = computed(() => franchise.value?.logo_url ?? null)
    const logoDarkUrl = computed(() => franchise.value?.logo_dark_url ?? null)
    const addressMap = computed(() => franchise.value?.address_map ?? false)
    const rating = computed(() => franchise.value?.rating ?? null)
    const loginCallMode = computed(() => franchise.value?.login_call_mode ?? 'inbound')
    const clientAuth = computed(() => franchise.value?.client_auth ?? true)
    const clientAuthRequired = computed(() => franchise.value?.client_auth_required ?? false)

    async function load() {
      try {
        franchise.value = await FranchiseService.getFranchise()
      } catch (error) {
        console.error('[FranchiseStore] Failed to load franchise settings:', error)
      }
    }

    async function init() {
      await load()
    }

    return {
      franchise,
      name,
      description,
      primaryColor,
      darkPrimaryColor,
      defaultTheme,
      legal,
      logoUrl,
      logoDarkUrl,
      addressMap,
      clientAuth,
      clientAuthRequired,
      rating,
      loginCallMode,
      init,
    }
  },
  { persist: { pick: ['franchise'] } },
)
