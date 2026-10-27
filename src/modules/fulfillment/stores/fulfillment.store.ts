import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import type { DeliveryAddress } from '../utils/deliveryAddress'

export type FulfillmentChoice = { type: 'delivery'; address: DeliveryAddress } | { type: 'pickup' }

export const useFulfillmentStore = defineStore(
  'fulfillment',
  () => {
    const branchStore = useBranchStore()
    const choices = ref<Record<string, FulfillmentChoice>>({})

    const current = computed<FulfillmentChoice | null>(() => {
      const branchId = branchStore.activeBranch?.id
      return branchId ? (choices.value[branchId] ?? null) : null
    })

    const deliveryAddress = computed(() =>
      current.value?.type === 'delivery' ? current.value.address : null,
    )

    function choose(branchId: string, choice: FulfillmentChoice) {
      choices.value = { ...choices.value, [branchId]: choice }
    }

    return { choices, current, deliveryAddress, choose }
  },
  { persist: { pick: ['choices'] } },
)
