import { defineStore } from 'pinia'
import { ref } from 'vue'
import Cookies from 'js-cookie'
import { BranchService, type Branch } from '../api/branch.service'
import { useBranchSchedule } from '../composables/useBranchSchedule'

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
  const branches = ref<Branch[]>([])
  const activeBranch = ref<Branch | null>(null)
  const isInitialized = ref(false)
  const isModalOpen = ref(false)

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

  async function initBranches() {
    if (isInitialized.value) return
    try {
      branches.value = await BranchService.getBranches()
      isInitialized.value = true
    } catch (error) {
      console.error('[BranchStore] Failed to initialize branches:', error)
      throw error
    }
  }

  async function selectBranch(branch: Branch) {
    if (activeBranch.value?.id === branch.id) return
    const previousBranch = activeBranch.value
    try {
      const selected = await BranchService.selectBranch(branch.id)
      activeBranch.value = selected || branch
      writeSavedBranchId(activeBranch.value.id)
      return activeBranch.value
    } catch (error) {
      activeBranch.value = previousBranch
      throw error
    }
  }

  async function selectBranchBySlug(slug: string): Promise<Branch> {
    if (activeBranch.value?.slug === slug) return activeBranch.value
    const previousBranch = activeBranch.value
    try {
      const selected = await BranchService.selectBranchBySlug(slug)
      activeBranch.value = selected
      writeSavedBranchId(selected.id)
      return selected
    } catch (error) {
      activeBranch.value = previousBranch
      throw error
    }
  }

  async function clearActiveBranch() {
    const previousBranch = activeBranch.value
    activeBranch.value = null
    writeSavedBranchId(null)
    try {
      await BranchService.clearActive()
    } catch (error) {
      activeBranch.value = previousBranch
      throw error
    }
  }

  function getBranchIdFromCookie(): string | undefined {
    return Cookies.get('active_branch_id') ?? readSavedBranchId()
  }

  return {
    branches,
    activeBranch,
    isInitialized,
    isModalOpen,
    openModal,
    closeModal,
    toggleModal,
    initBranches,
    selectBranch,
    selectBranchBySlug,
    clearActiveBranch,
    getBranchIdFromCookie,
    ...schedule,
  }
})
