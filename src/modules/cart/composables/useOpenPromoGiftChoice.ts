import { useI18n } from 'vue-i18n'
import PromoGiftChoiceModal from '../components/PromoGiftChoiceModal.vue'
import { useViewportStore } from '@/modules/shared/stores/viewport.store'
import { useMobileModalStore } from '@/modules/widgets/modal/mobile-modal/stores/modal.store'
import { useDesktopModalStore } from '@/modules/widgets/modal/desktop-modal/stores/modal.store'

export function useOpenPromoGiftChoice() {
  const { t } = useI18n()
  const viewport = useViewportStore()
  const mobile = useMobileModalStore()
  const desktop = useDesktopModalStore()
  return (promotionId: string) => {
    const store = viewport.isMobile ? mobile : desktop
    store.openModal({
      component: PromoGiftChoiceModal,
      props: { promotionId },
      headerTitle: t('promo.giftChoice.title'),
    })
  }
}
