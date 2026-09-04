import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    isSidebarVisible: false,
  }),
  actions: {
    toggleSidebar() {
      this.isSidebarVisible = !this.isSidebarVisible
    },
    setSidebarVisible(value: boolean) {
      this.isSidebarVisible = value
    },
  },
})
