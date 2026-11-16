import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const menu = ref<{ products: { id: string; popular: boolean; suggested: boolean }[] }[]>([])
const cartItems = ref<{ product_id: string; gift: boolean }[]>([])

vi.mock('@/modules/menu/composables/useMenuQuery', () => ({
  useMenuQuery: () => ({ data: menu }),
}))
vi.mock('@/modules/cart/stores/cart.store', () => ({
  useCartStore: () => ({
    get items() {
      return cartItems.value
    },
  }),
}))

const { useCartSuggestions } = await import('@/modules/cart/composables/useCartSuggestions')

const product = (id: string, popular = false, suggested = false) => ({ id, popular, suggested })

beforeEach(() => {
  menu.value = []
  cartItems.value = []
})

describe('useCartSuggestions', () => {
  it('shows each product once when Popular repeats products from regular categories', () => {
    menu.value = [
      {
        products: [
          product('popular', true),
          ...Array.from({ length: 11 }, (_, i) => product(`p${i}`, true)),
        ],
      },
      { products: [product('popular', true), product('last', false, true)] },
    ]

    const suggestions = useCartSuggestions()

    expect(suggestions.value.map(({ id }) => id)).toEqual([
      'popular',
      ...Array.from({ length: 11 }, (_, i) => `p${i}`),
    ])
    expect(new Set(suggestions.value.map(({ id }) => id)).size).toBe(12)
  })

  it('deduplicates before the limit so a repeated product does not displace a unique suggestion', () => {
    menu.value = [
      {
        products: [
          product('popular', true),
          product('popular', true),
          ...Array.from({ length: 11 }, (_, i) => product(`p${i}`, false, true)),
        ],
      },
    ]

    expect(useCartSuggestions().value.map(({ id }) => id)).toEqual([
      'popular',
      ...Array.from({ length: 11 }, (_, i) => `p${i}`),
    ])
  })

  it('keeps suggested products independent of popular and excludes products already in the cart', () => {
    menu.value = [
      { products: [product('popular', true), product('suggested', false, true), product('other')] },
    ]
    cartItems.value = [{ product_id: 'popular', gift: false }]

    expect(useCartSuggestions().value.map(({ id }) => id)).toEqual(['suggested'])
  })

  it('keeps gifted products eligible and reacts when a paid item enters the cart', () => {
    menu.value = [{ products: [product('popular', true), product('suggested', false, true)] }]
    cartItems.value = [{ product_id: 'popular', gift: true }]
    const suggestions = useCartSuggestions()

    expect(suggestions.value.map(({ id }) => id)).toEqual(['popular', 'suggested'])

    cartItems.value = [{ product_id: 'popular', gift: false }]
    expect(suggestions.value.map(({ id }) => id)).toEqual(['suggested'])
  })
})
