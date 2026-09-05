import { defineStore } from 'pinia'
import { useMediaQuery } from '@vueuse/core'

export const useViewportStore = defineStore('viewport', () => {
  const isMobile = useMediaQuery('(max-width: 767px)')

  return { isMobile }
})
