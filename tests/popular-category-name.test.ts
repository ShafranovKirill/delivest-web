import { describe, expect, it } from 'vitest'
import { en } from '../src/i18n/locales/en'
import { ru } from '../src/i18n/locales/ru'
import {
  categoryDisplayName,
  POPULAR_CATEGORY_ID,
} from '../src/modules/menu/utils/categoryDisplayName'

describe('popular category display name', () => {
  const popular = { id: POPULAR_CATEGORY_ID, name: 'Popular' }

  it('uses the selected language for the virtual category regardless of the API name', () => {
    expect(categoryDisplayName(popular, ru.menu.popular)).toBe('Популярные')
    expect(categoryDisplayName({ ...popular, name: 'Популярное' }, en.menu.popular)).toBe('Popular')
  })

  it('preserves names of ordinary categories, including one named Popular', () => {
    expect(categoryDisplayName({ id: 'real-category', name: 'Popular' }, ru.menu.popular)).toBe(
      'Popular',
    )
    expect(categoryDisplayName({ id: 'another-category', name: 'Десерты' }, en.menu.popular)).toBe(
      'Десерты',
    )
  })
})
