import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { DeliveryService } from '../api/delivery.service'

export const useDeliveryZones = () => {
  const branchStore = useBranchStore()
  const branchId = computed(() => branchStore.activeBranch?.id ?? null)

  const query = useQuery({
    queryKey: computed(() => ['delivery-zones', branchId.value]),
    queryFn: () => DeliveryService.zones(branchId.value!),
    enabled: computed(() => Boolean(branchId.value)),
    staleTime: 5 * 60 * 1000,
  })

  return computed(() => query.data.value ?? [])
}
