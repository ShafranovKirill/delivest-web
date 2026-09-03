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
    } catch (error) {
      console.error('Ошибка загрузки филиалов:', error)
    } finally {
      isInitialized.value = true
    }
  }

  async function selectBranch(branch: Branch) {
    activeBranch.value = branch
    try {
      await BranchService.selectBranch(branch.id)
    } catch (error) {
      console.error('Ошибка установки активного филиала:', error)
    }
  }

  async function clearActiveBranch() {
    activeBranch.value = null
    try {
      await BranchService.clearActive()
    } catch (error) {
      console.error('Ошибка очистки активного филиала:', error)
    }
  }

  // Читаем active_branch_id из кук (так как http_only: false)
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
