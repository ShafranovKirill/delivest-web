import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBranchStore } from '@/modules/branch/stores/branch.store'

export function useAccountLinks() {
  const { t } = useI18n()
  const branch = useBranchStore()

  return computed(() => [
    ...(branch.activeBranch?.branch_info?.loyalty?.enabled
      ? [{ route: 'my-stars', label: t('loyalty.title'), icon: 'pi pi-star-fill' }]
      : []),
    { route: 'my-orders', label: t('nav.myOrders'), icon: 'pi pi-receipt' },
    { route: 'my-addresses', label: t('nav.myAddresses'), icon: 'pi pi-map-marker' },
  ])
}
