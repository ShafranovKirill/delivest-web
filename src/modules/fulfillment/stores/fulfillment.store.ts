import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { fulfillmentMethods } from '../utils/fulfillmentMethods'
import type { DeliveryAddress } from '../utils/deliveryAddress'

export type FulfillmentChoice = { type: 'delivery'; address: DeliveryAddress } | { type: 'pickup' }

export const useFulfillmentStore = defineStore(
  'fulfillment',
  () => {
    const branchStore = useBranchStore()
    const choices = ref<Record<string, FulfillmentChoice>>({})

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

    const deliveryAddress = computed(() =>
      current.value?.type === 'delivery' ? current.value.address : null,
    )

    function choose(branchId: string, choice: FulfillmentChoice) {
      choices.value = { ...choices.value, [branchId]: choice }
    }

    return { choices, current, deliveryAddress, choose, methods, canOrder, availableModes }
  },
  { persist: { pick: ['choices'] } },
)
