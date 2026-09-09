import { defineStore } from 'pinia'
import { StockService, type Stock } from '../api/stock.service'

export const useStockStore = defineStore('stock', {
  state: () => ({
    stocks: [] as Stock[],
    isLoadingStocks: false,
    isStockModalOpen: false,
    activeStock: null as Stock | null,
  }),

  getters: {},

  actions: {
    resetStocks() {
      this.stocks = []
      this.activeStock = null
      this.isStockModalOpen = false
    },

    async fetchStocks(branchId: string) {
      this.resetStocks()

      this.isLoadingStocks = true
      try {
        this.stocks = await StockService.getStocks(branchId)
      } catch (error) {
        console.error('[StockStore] Failed to fetch stocks:', error)
        this.stocks = []
      } finally {
        this.isLoadingStocks = false
      }
    },

    openProductModal(stock: Stock) {
      this.activeStock = stock
      this.isStockModalOpen = true
    },

    closeProductModal() {
      this.activeStock = null
      this.isStockModalOpen = false
    },
  },
})
