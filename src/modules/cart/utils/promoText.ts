import type { PromoCodeState, PromoReason, PromoRejection } from '../api/cart.service'

const FULFILLMENT: Record<string, string> = {
  delivery: 'доставка',
  pickup: 'самовывоз',
  dine_in: 'в зале',
}

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

const REJECTED: Record<PromoRejection, string> = {
  not_found: 'Промокод не найден',
  inactive: 'Промокод сейчас не действует',
  not_started: 'Акция ещё не началась',
  expired: 'Срок действия промокода истёк',
  exhausted: 'Промокоды по этой акции закончились',
  requires_client: 'Войдите в аккаунт, чтобы применить промокод',
  client_limit: 'Вы уже использовали этот промокод',
  not_owner: 'Этот промокод выдан другому клиенту',
  code_used: 'Промокод уже использован',
  code_required: 'Нужен промокод',
}

export function reasonText(reason: PromoReason): string {
  switch (reason.type) {
    case 'subtotal':
      return `добавьте товаров ещё на ${reason.missing} ₽`
    case 'quantity':
      return `добавьте ещё ${reason.missing} шт.`
    case 'product':
      return `добавьте «${reason.name}»${(reason.missing ?? 1) > 1 ? ` × ${reason.missing}` : ''}`
    case 'fulfillment':
      return `только ${(reason.allowed ?? []).map((type) => FULFILLMENT[type]).join(' или ')}`
    case 'time':
      return `действует с ${reason.from} до ${reason.to}`
    case 'weekday':
      return `действует: ${(reason.days ?? []).map((day) => WEEKDAYS[day - 1]).join(', ')}`
    case 'requires_client':
      return 'войдите в аккаунт'
  }
}

export function reasonsText(reasons: PromoReason[]): string {
  return reasons.map(reasonText).join('; ')
}

export function rejectedText(state: PromoCodeState): string {
  return state.reason ? REJECTED[state.reason] : 'Промокод нельзя применить'
}
