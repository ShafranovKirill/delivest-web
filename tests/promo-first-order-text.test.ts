import { describe, expect, it, vi } from 'vitest'
import { en } from '../src/i18n/locales/en'
import { ru } from '../src/i18n/locales/ru'

vi.mock('@/i18n', () => ({ t: (key: string) => key }))

import { reasonText } from '../src/modules/cart/utils/promoText'

describe('first-order promotion reason', () => {
  it('has a display path and clear translations in both languages', () => {
    expect(reasonText({ type: 'first_order' })).toBe('promo.reason.firstOrder')
    expect(en.promo.reason.firstOrder).toContain('first website order')
    expect(ru.promo.reason.firstOrder).toContain('первого заказа')
  })
})
