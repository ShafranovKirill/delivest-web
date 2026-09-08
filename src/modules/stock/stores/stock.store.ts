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
    async fetchStocks(branchId: string) {
      this.isLoadingStocks = true
      try {
        this.stocks = await StockService.getStocks(branchId)
      } catch (error) {
        console.error('[MenuStore] Failed to fetch stocks:', error)
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
