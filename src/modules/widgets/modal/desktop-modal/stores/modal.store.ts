import { defineStore } from 'pinia'
import { ref, markRaw } from 'vue'
import type { Component } from 'vue'

export interface DesktopModalOptions {
  component: Component
  props?: Record<string, unknown>
  headerTitle?: string
}

export const useDesktopModalStore = defineStore('desktopModal', () => {
  const isOpen = ref(false)
  const currentComponent = ref<Component | null>(null)
  const currentProps = ref<Record<string, unknown>>({})
  const title = ref<string>('')
  let closeTimeout: ReturnType<typeof setTimeout> | null = null

  function openModal({ component, props = {}, headerTitle = '' }: DesktopModalOptions) {
    if (closeTimeout !== null) {
      clearTimeout(closeTimeout)
      closeTimeout = null
    }
    currentComponent.value = markRaw(component)
    currentProps.value = props
    title.value = headerTitle
    isOpen.value = true
  }

  function closeModal() {
    isOpen.value = false
    if (closeTimeout !== null) clearTimeout(closeTimeout)
    closeTimeout = setTimeout(() => {
      currentComponent.value = null
      currentProps.value = {}
      title.value = ''
      closeTimeout = null
    }, 300)
  }

  return {
    isOpen,
    currentComponent,
    currentProps,
    title,
    openModal,
    closeModal,
  }
})
