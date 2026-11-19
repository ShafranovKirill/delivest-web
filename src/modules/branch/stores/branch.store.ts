import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import Cookies from 'js-cookie'
import { BranchService, type Branch } from '../api/branch.service'
import { useBranchSchedule } from '../composables/useBranchSchedule'
import { loadStorefront, rememberMenuValidity, rememberWatermark, seedAdvertisingConfig } from '@/api/storefront'
import { queryClient } from '@/api/client'
import { currentLocale } from '@/i18n'
import { primeSession } from '@/router/primeSession'

const SAVED_BRANCH_KEY = 'delivest:active_branch_id'

function readSavedBranchId(): string | undefined {
  try {
    return localStorage.getItem(SAVED_BRANCH_KEY) ?? undefined
  } catch {
    return undefined
  }
}

function writeSavedBranchId(id: string | null) {
  try {
    if (id) localStorage.setItem(SAVED_BRANCH_KEY, id)
    else localStorage.removeItem(SAVED_BRANCH_KEY)
  } catch {}
}

export const useBranchStore = defineStore('branch', () => {
  const franchiseStore = useFranchiseStore()
  const branches = ref<Branch[]>([])
  const activeBranch = ref<Branch | null>(null)
  const isInitialized = ref(false)
  const isModalOpen = ref(false)
  let bootstrapGeneration = 0

  const schedule = useBranchSchedule(activeBranch)

  function openModal() {
    isModalOpen.value = true
  }
  function closeModal() {
    isModalOpen.value = false
  }
  function toggleModal() {
    isModalOpen.value = !isModalOpen.value
  }

  async function refreshBranches() {
    branches.value = await BranchService.getBranches()
    if (activeBranch.value)
      activeBranch.value = branches.value.find((b) => b.id === activeBranch.value?.id) ?? null
    isInitialized.value = true
  }

  async function initBranches() {
    if (isInitialized.value) return
    try {
      await loadBootstrap()
      isInitialized.value = true
    } catch (error) {
      console.error('[BranchStore] Failed to initialize branches:', error)
      throw error
    }
  }

  async function loadBootstrap(slug?: string) {
    const generation = ++bootstrapGeneration
    const requestedLocale = currentLocale()
    const response = await loadStorefront(slug, slug ? undefined : readSavedBranchId())
    if (generation !== bootstrapGeneration || requestedLocale !== currentLocale()) throw new Error('Superseded storefront response')
    if (slug && response.selected_branch?.slug !== slug) throw new Error('Branch not found')
    franchiseStore.setFranchise(response.franchise)
    branches.value = response.branches as Branch[]
    activeBranch.value = response.selected_branch
    // Create the private request in the same turn as selection, before cart's
    // branch watcher can issue its legacy GET in the next microtask.
    if (response.selected_branch) primeSession()
    if (response.selected_branch) {
      const id = response.selected_branch.id
      seedAdvertisingConfig(id, response.advertising, response.valid_until)
      rememberWatermark(id, { revisions: response.revisions, valid_until: response.valid_until })
      writeSavedBranchId(id)
      if (response.menu) {
        queryClient.setQueryData(['menu', id, requestedLocale], response.menu, { updatedAt: Date.now() })
        rememberMenuValidity(id, requestedLocale, response.valid_until)
      }
      if (response.stories) queryClient.setQueryData(['stocks', id], response.stories, { updatedAt: Date.now() })
    }
    isInitialized.value = true
    return response
  }

  async function selectBranch(branch: Branch) {
    if (activeBranch.value?.id === branch.id) return
    const previousBranch = activeBranch.value
    const selectionGeneration = bootstrapGeneration + 1
    try {
      const selected = await loadBootstrap(branch.slug)
      if (!selected.selected_branch) throw new Error('Branch not found')
      return selected.selected_branch
    } catch (error) {
      if (bootstrapGeneration === selectionGeneration) activeBranch.value = previousBranch
      throw error
    }
  }

  async function selectBranchBySlug(slug: string): Promise<Branch> {
    if (activeBranch.value?.slug === slug) return activeBranch.value
    const previousBranch = activeBranch.value
    const selectionGeneration = bootstrapGeneration + 1
    try {
      const selected = await loadBootstrap(slug)
      if (!selected.selected_branch) throw new Error('Branch not found')
      return selected.selected_branch
    } catch (error) {
      if (bootstrapGeneration === selectionGeneration) activeBranch.value = previousBranch
      throw error
    }
  }

  async function clearActiveBranch() {
    const previousBranch = activeBranch.value
    const generation = ++bootstrapGeneration
    activeBranch.value = null
    writeSavedBranchId(null)
    primeSession()
    try {
      await BranchService.clearActive()
    } catch (error) {
      if (generation === bootstrapGeneration) activeBranch.value = previousBranch
      throw error
    }
  }

  function getBranchIdFromCookie(): string | undefined {
    return readSavedBranchId() ?? Cookies.get('active_branch_id')
  }

  // Delivery address settings of the active branch. The site asks for the address
  // on the map only when `mapAddress` is on; the operator checkbox is opt-in.
  const mapAddress = computed(
    () => activeBranch.value?.branch_info?.delivery?.map_address !== false,
  )
  const addressModeSet = computed(
    () => activeBranch.value?.branch_info?.delivery?.address_mode_set === true,
  )
  const requiresCoordinates = computed(
    () => mapAddress.value && (franchiseStore.addressMap || addressModeSet.value),
  )
  const operatorAddress = computed(
    () =>
      activeBranch.value?.branch_info?.delivery?.map_address === false &&
      activeBranch.value?.branch_info?.delivery?.operator_address === true,
  )

  return {
    branches,
    activeBranch,
    isInitialized,
    isModalOpen,
    mapAddress,
    addressModeSet,
    requiresCoordinates,
    operatorAddress,
    openModal,
    closeModal,
    toggleModal,
    initBranches,
    loadBootstrap,
    refreshBranches,
    selectBranch,
    selectBranchBySlug,
    clearActiveBranch,
    getBranchIdFromCookie,
    ...schedule,
  }
})
