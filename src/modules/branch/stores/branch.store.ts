import { defineStore } from 'pinia'
import { ref } from 'vue'
import Cookies from 'js-cookie'
import { BranchService, type Branch } from '../api/branch.service'
import { useStockStore } from '@/modules/stock/stores/stock.store'
import { useMenuStore } from '@/modules/menu/stores/menu.store' // если есть стор меню

export const useBranchStore = defineStore('branch', () => {
  const branches = ref<Branch[]>([])
  const activeBranch = ref<Branch | null>(null)
  const isInitialized = ref(false)

  const isModalOpen = ref(false)

  function openModal() {
    isModalOpen.value = true
  }

  function closeModal() {
    isModalOpen.value = false
  }

  function toggleModal() {
    isModalOpen.value = !isModalOpen.value
  }

  function resetDependentData() {
    const stockStore = useStockStore()
    stockStore.resetStocks()
    const menuStore = useMenuStore()
    menuStore.resetMenu()
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
    activeBranch.value = branch

    resetDependentData()

    try {
      await BranchService.selectBranch(branch.id)
    } catch (error) {
      activeBranch.value = previousBranch
      console.error(`[BranchStore] Failed to select branch ID ${branch.id}:`, error)
      throw error
    }
  }

  async function selectBranchBySlug(slug: string): Promise<Branch> {
    if (activeBranch.value?.slug === slug) {
      return activeBranch.value
    }

    const previousBranch = activeBranch.value

    try {
      const selected = await BranchService.selectBranchBySlug(slug)
      activeBranch.value = selected

      resetDependentData()

      return selected
    } catch (error) {
      activeBranch.value = previousBranch
      console.error(`[BranchStore] Failed to select branch slug ${slug}:`, error)
      throw error
    }
  }

  async function clearActiveBranch() {
    const previousBranch = activeBranch.value
    activeBranch.value = null
    resetDependentData()

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
    isModalOpen,
    openModal,
    closeModal,
    toggleModal,
    initBranches,
    selectBranch,
    selectBranchBySlug,
    clearActiveBranch,
    getBranchIdFromCookie,
  }
})
