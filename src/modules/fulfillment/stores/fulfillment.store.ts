import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { fulfillmentMethods } from '../utils/fulfillmentMethods'
import type { DeliveryAddress } from '../utils/deliveryAddress'

export type FulfillmentChoice =
  | { type: 'delivery'; address: DeliveryAddress | null; addressByOperator?: boolean }
  | { type: 'pickup' }

const STORAGE_KEY = 'fulfillment:v2'

export const useFulfillmentStore = defineStore('fulfillment', () => {
  const branchStore = useBranchStore()
  const authStore = useAuthStore()
  const owner = () => authStore.client?.id ?? 'guest'
  const choices = ref<Record<string, FulfillmentChoice>>({})
  let currentOwner = owner()
  try {
    localStorage.removeItem('fulfillment') // Legacy entries had no owner and cannot be trusted.
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
    if (saved?.owner === currentOwner && saved.choices && typeof saved.choices === 'object') {
      choices.value = saved.choices
    }
  } catch {
    // Storage is optional.
  }
  function save() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ owner: currentOwner, choices: choices.value }),
      )
    } catch {
      // Storage is optional.
    }
  }
  watch(
    () => authStore.client?.id ?? 'guest',
    (next) => {
      if (next === currentOwner) return
      if (currentOwner !== 'guest') choices.value = {}
      currentOwner = next
      save()
    },
    { flush: 'sync' },
  )

  const methods = computed(() => fulfillmentMethods(branchStore.activeBranch))
  const canOrder = computed(() => methods.value.length > 0)
  const availableModes = computed<Array<'delivery' | 'pickup'>>(() => [
    ...(methods.value.includes('delivery') ? ['delivery' as const] : []),
    ...(methods.value.some((m) => m !== 'delivery') ? ['pickup' as const] : []),
  ])
  const current = computed<FulfillmentChoice | null>(() => {
    const branchId = branchStore.activeBranch?.id
    const choice = branchId ? choices.value[branchId] : null
    return choice && availableModes.value.includes(choice.type) ? choice : null
  })

  const addressByOperator = computed(
    () => current.value?.type === 'delivery' && branchStore.operatorAddress && current.value.addressByOperator === true,
  )

  const deliveryAddress = computed(() =>
    current.value?.type === 'delivery' && !addressByOperator.value ? current.value.address : null,
  )

  function choose(branchId: string, choice: FulfillmentChoice) {
    choices.value = { ...choices.value, [branchId]: choice }
    save()
  }

  return { choices, current, addressByOperator, deliveryAddress, choose, methods, canOrder, availableModes }
})
