import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useFulfillmentStore } from './fulfillment.store'

export type PickerMode = 'delivery' | 'pickup'

export const useFulfillmentFlowStore = defineStore('fulfillmentFlow', () => {
  const fulfillmentStore = useFulfillmentStore()
  const authStore = useAuthStore()

  const isPromptOpen = ref(false)
  const isPickerOpen = ref(false)
  const pickerMode = ref<PickerMode>('delivery')

  let pending: ((chosen: boolean) => void) | null = null

  function settle(chosen: boolean) {
    pending?.(chosen)
    pending = null
  }

  function ensure(): Promise<boolean> {
    if (fulfillmentStore.current) return Promise.resolve(true)

    if (!fulfillmentStore.canOrder) {
      isPromptOpen.value = true
      return Promise.resolve(false)
    }
    settle(false)
    return new Promise((resolve) => {
      pending = resolve
      if (fulfillmentStore.availableModes.length === 1)
        openPicker(fulfillmentStore.availableModes[0]!)
      else isPromptOpen.value = true
    })
  }

  function openPicker(mode: PickerMode) {
    if (!fulfillmentStore.canOrder) {
      isPromptOpen.value = true
      isPickerOpen.value = false
      settle(false)
      return
    }
    pickerMode.value = fulfillmentStore.availableModes.includes(mode)
      ? mode
      : fulfillmentStore.availableModes[0]!
    isPickerOpen.value = true
    isPromptOpen.value = false
  }

  function complete() {
    isPickerOpen.value = false
    settle(true)
  }

  function abandon() {
    isPickerOpen.value = false
    settle(false)
  }

  function dismiss() {
    if (!isPromptOpen.value && !isPickerOpen.value) settle(false)
  }

  function signIn() {
    isPromptOpen.value = false
    settle(false)
    authStore.openModal()
  }

  return {
    isPromptOpen,
    isPickerOpen,
    pickerMode,
    ensure,
    openPicker,
    complete,
    abandon,
    dismiss,
    signIn,
  }
})
