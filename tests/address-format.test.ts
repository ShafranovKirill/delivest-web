import { describe, expect, it } from 'vitest'
import { applyLocale } from '@/i18n'
import { formatAddress } from '@/modules/shared/utils/address'

describe('formatAddress', () => {
  it('shows the block and building in an order address without duplicating a saved house line', () => {
    applyLocale('ru')
    expect(formatAddress({ street: 'Тверская', house: '7', block: '1', building: '2' })).toBe(
      'Тверская, д. 7 к 1 стр 2',
    )
    expect(formatAddress({ street: 'Тверская', house: '7 к 1 стр 2' })).toBe(
      'Тверская, д. 7 к 1 стр 2',
    )
  })
})
