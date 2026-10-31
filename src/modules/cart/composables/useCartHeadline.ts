import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { intlLocale } from '@/i18n'
import { formatPrice } from '@/utils/money'
import { useCartStore } from '../stores/cart.store'

export function useCartHeadline() {
  const { t } = useI18n()
  const cartStore = useCartStore()

  return computed(() => {
    const count = cartStore.totalQuantity
    const rule = new Intl.PluralRules(intlLocale()).select(count)
    return t(`cart.headline.${rule}`, { count, sum: formatPrice(cartStore.totalAmount) })
  })
}
