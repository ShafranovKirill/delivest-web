import { defineStore } from 'pinia'
import { ref } from 'vue'
import Cookies from 'js-cookie'
import { BranchService, type Branch } from '../api/branch.service'

export const useBranchStore = defineStore('branch', () => {
  const branches = ref<Branch[]>([])
  const activeBranch = ref<Branch | null>(null)
  const isInitialized = ref(false)

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
    const previousBranch = activeBranch.value
    activeBranch.value = branch

    try {
      await BranchService.selectBranch(branch.id)
    } catch (error) {
      activeBranch.value = previousBranch
      console.error(`[BranchStore] Failed to select branch ID ${branch.id}:`, error)
      throw error
    }
  }

  async function clearActiveBranch() {
    const previousBranch = activeBranch.value
    activeBranch.value = null

    try {
      await BranchService.clearActive()
    } catch (error) {
      activeBranch.value = previousBranch
      console.error('[BranchStore] Failed to clear active branch:', error)
      throw error
    }
  }

  function getBranchIdFromCookie(): string | undefined {
    return Cookies.get('active_branch_id')
  }

  return {
    branches,
    activeBranch,
    isInitialized,
    initBranches,
    selectBranch,
    clearActiveBranch,
    getBranchIdFromCookie,
  }
})
