import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useFulfillmentStore } from './fulfillment.store'
import { emptyDeliveryAddress, type DeliveryAddress } from '../utils/deliveryAddress'

export type PickerMode = 'delivery' | 'pickup'

export const useFulfillmentFlowStore = defineStore('fulfillmentFlow', () => {
  const fulfillmentStore = useFulfillmentStore()
  const authStore = useAuthStore()
  const branchStore = useBranchStore()

  const isPromptOpen = ref(false)
  const isPickerOpen = ref(false)
  const pickerMode = ref<PickerMode>('delivery')
  const addressDrafts = ref<Record<string, DeliveryAddress>>({})
  watch(
    () => authStore.client?.id ?? 'guest',
    (_next, previous) => {
      if (previous && previous !== 'guest') {
        addressDrafts.value = {}
        isPickerOpen.value = false
        settle(false)
      }
    },
    { flush: 'sync' },
  )

  function saveAddressDraft(branchId: string, address: DeliveryAddress) {
    addressDrafts.value[branchId] = { ...address }
  }

  function clearAddressDraft(branchId: string) {
    delete addressDrafts.value[branchId]
  }

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

    // With the map off the site never asks for the address up front: the customer
    // enters it in the order form, so delivery is chosen silently.
    if (
      !branchStore.mapAddress &&
      fulfillmentStore.availableModes.length === 1 &&
      fulfillmentStore.availableModes[0] === 'delivery'
    ) {
      chooseManualDelivery()
      return Promise.resolve(Boolean(fulfillmentStore.current))
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
    if (
      mode === 'delivery' &&
      !branchStore.mapAddress &&
      fulfillmentStore.availableModes.includes('delivery')
    ) {
      chooseManualDelivery()
      isPromptOpen.value = false
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

  function chooseManualDelivery() {
    const branchId = branchStore.activeBranch?.id
    if (!branchId) return
    if (fulfillmentStore.current?.type !== 'delivery') {
      fulfillmentStore.choose(branchId, {
        type: 'delivery',
        address: emptyDeliveryAddress(branchStore.activeBranch?.branch_info?.city ?? ''),
      })
    }
    complete()
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
    addressDrafts,
    saveAddressDraft,
    clearAddressDraft,
    ensure,
    openPicker,
    complete,
    chooseManualDelivery,
    abandon,
    dismiss,
    signIn,
  }
})
