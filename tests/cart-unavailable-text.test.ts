import { describe, expect, it } from 'vitest'
import { en } from '@/i18n/locales/en'
import { ru } from '@/i18n/locales/ru'

describe('unavailable cart messages', () => {
  it('resolves the labels used by the cart item in both locales', () => {
    for (const locale of [ru, en]) {
      expect(locale.cart.unavailable).toBeTruthy()
      expect(locale.cart.unavailableProduct).toBeTruthy()
    }
  })
})
