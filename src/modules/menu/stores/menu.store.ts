import { defineStore } from 'pinia'
import type { MenuProduct } from '../api/menu.service'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    activeCategoryId: null as string | null,
    isManualScroll: false,
    isProductModalOpen: false,
    activeProduct: null as MenuProduct | null,
  }),

  getters: {
    isActive: (state) => (id: string | undefined) => {
      if (!id) return false
      return state.activeCategoryId === id
    },
  },

  actions: {
    resetMenu() {
      this.activeCategoryId = null
      this.isManualScroll = false
      this.isProductModalOpen = false
      this.activeProduct = null
    },

    setActiveCategory(id: string | undefined) {
      if (!id) return
      this.activeCategoryId = id
    },

    async scrollToCategory(categoryId: string | undefined) {
      if (!categoryId) return

      this.isManualScroll = true
      this.activeCategoryId = categoryId

      const element = document.getElementById(`category-${categoryId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }

      await new Promise((resolve) => setTimeout(resolve, 500))

      this.isManualScroll = false
    },

    openProductModal(product: MenuProduct) {
      this.activeProduct = product
      this.isProductModalOpen = true
    },

    closeProductModal() {
      this.activeProduct = null
      this.isProductModalOpen = false
    },
  },
})
