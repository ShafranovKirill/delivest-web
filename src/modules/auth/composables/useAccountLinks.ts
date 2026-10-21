import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useAccountLinks() {
  const { t } = useI18n()

  return computed(() => [
    { route: 'my-orders', label: t('nav.myOrders'), icon: 'pi pi-receipt' },
    { route: 'my-addresses', label: t('nav.myAddresses'), icon: 'pi pi-map-marker' },
  ])
}
