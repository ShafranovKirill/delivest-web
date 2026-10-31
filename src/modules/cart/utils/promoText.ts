import type { PromoCodeState, PromoReason } from '../api/cart.service'
import { t } from '@/i18n'
import { formatPrice } from '@/utils/money'

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function fulfillments(reason: PromoReason): string {
  return (reason.allowed ?? []).map((type) => t(`promo.fulfillment.${type}`)).join(t('promo.or'))
}

function weekdays(reason: PromoReason): string {
  return (reason.days ?? []).map((day) => t(`promo.weekday.${WEEKDAYS[day - 1]}`)).join(', ')
}

export function reasonText(reason: PromoReason): string {
  switch (reason.type) {
    case 'subtotal':
      return t('promo.reason.subtotal', { amount: formatPrice(reason.missing) })
    case 'quantity':
      return t('promo.reason.quantity', { count: reason.missing })
    case 'product':
      return (reason.missing ?? 1) > 1
        ? t('promo.reason.productMany', { name: reason.name, count: reason.missing })
        : t('promo.reason.product', { name: reason.name })
    case 'fulfillment':
      return t('promo.reason.fulfillment', { types: fulfillments(reason) })
    case 'time':
      return t('promo.reason.time', { from: reason.from, to: reason.to })
    case 'weekday':
      return t('promo.reason.weekday', { days: weekdays(reason) })
    case 'requires_client':
      return t('promo.reason.requiresClient')
  }
}

export function reasonsText(reasons: PromoReason[]): string {
  return reasons.map(reasonText).join('; ')
}

export function rejectedText(state: PromoCodeState): string {
  return state.reason ? t(`promo.rejected.${state.reason}`) : t('promo.rejected.fallback')
}
