import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { emptyDeliveryAddress } from '../utils/deliveryAddress'
import { useFulfillmentStore } from './fulfillment.store'
import type { DeliveryAddress } from '../utils/deliveryAddress'

export type PickerMode = 'delivery' | 'pickup'

export const useFulfillmentFlowStore = defineStore('fulfillmentFlow', () => {
  const fulfillmentStore = useFulfillmentStore()
  const authStore = useAuthStore()
  const branchStore = useBranchStore()

  const isPromptOpen = ref(false)
  const isPickerOpen = ref(false)
  const pickerMode = ref<PickerMode>('delivery')
  const preferredPickupKind = ref<'pickup' | 'dine_in' | null>(null)
  const addressDrafts = ref<Record<string, DeliveryAddress>>({})
  const manualDeliveryBranchId = ref<string | null>(null)
  const manualDeliverySelected = computed(
    () =>
      !branchStore.mapAddress &&
      manualDeliveryBranchId.value === branchStore.activeBranch?.id &&
      fulfillmentStore.availableModes.includes('delivery'),
  )
  watch(
    [() => branchStore.activeBranch?.id, () => branchStore.mapAddress],
    () => {
      manualDeliveryBranchId.value = null
    },
    { flush: 'sync' },
  )
  watch(
    () => authStore.client?.id ?? 'guest',
    (_next, previous) => {
      if (previous && previous !== 'guest') {
        addressDrafts.value = {}
        manualDeliveryBranchId.value = null
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
    if (manualDeliverySelected.value) return Promise.resolve(true)
    if (fulfillmentStore.current) return Promise.resolve(true)

    if (!fulfillmentStore.canOrder) {
      isPromptOpen.value = true
      return Promise.resolve(false)
    }

    if (
      !branchStore.mapAddress &&
      fulfillmentStore.availableModes.length === 1 &&
      fulfillmentStore.availableModes[0] === 'delivery'
    ) {
      chooseManualDelivery()
      return Promise.resolve(manualDeliverySelected.value)
    }

    settle(false)
    return new Promise((resolve) => {
      pending = resolve
      if (fulfillmentStore.availableModes.length === 1)
        openPicker(fulfillmentStore.availableModes[0]!)
      else isPromptOpen.value = true
    })
  }

  function openPicker(mode: PickerMode, pickupKind?: 'pickup' | 'dine_in') {
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
    manualDeliveryBranchId.value = null
    pickerMode.value = fulfillmentStore.availableModes.includes(mode)
      ? mode
      : fulfillmentStore.availableModes[0]!
    preferredPickupKind.value = pickupKind ?? null
    isPickerOpen.value = true
    isPromptOpen.value = false
  }

  function complete() {
    isPickerOpen.value = false
    settle(true)
  }

  function chooseManualDelivery() {
    const branchId = branchStore.activeBranch?.id
    if (!branchId || !fulfillmentStore.availableModes.includes('delivery')) return
    manualDeliveryBranchId.value = branchId
    if (!addressDrafts.value[branchId])
      saveAddressDraft(
        branchId,
        fulfillmentStore.current?.type === 'delivery' && fulfillmentStore.current.address
          ? fulfillmentStore.current.address
          : emptyDeliveryAddress(
              branchStore.showCity ? '' : (branchStore.activeBranch?.branch_info?.city ?? ''),
            ),
      )
    if (fulfillmentStore.current?.type === 'pickup')
      fulfillmentStore.choose(branchId, {
        type: 'delivery',
        address: addressDrafts.value[branchId]!,
      })
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
    preferredPickupKind,
    addressDrafts,
    manualDeliverySelected,
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
