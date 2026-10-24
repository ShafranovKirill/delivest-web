import { useI18n } from 'vue-i18n'
import CartComponent from '../components/CartComponent.vue'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'
import { useMobileModalStore } from '@/modules/widgets/modal/mobile-modal/stores/modal.store'
import { useDesktopModalStore } from '@/modules/widgets/modal/desktop-modal/stores/modal.store'

export function useOpenCart() {
  const { t } = useI18n()
  const viewportStore = useViewportStore()
  const mobileModalStore = useMobileModalStore()
  const desktopModalStore = useDesktopModalStore()

  return () => {
    const store = viewportStore.isMobile ? mobileModalStore : desktopModalStore
    store.openModal({ component: CartComponent, headerTitle: t('cart.title') })
  }
}
