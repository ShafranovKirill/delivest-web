import { computed } from 'vue'
import { useMenuQuery } from '@/modules/menu/composables/useMenuQuery'
import { useCartStore } from '../stores/cart.store'

const LIMIT = 12

export function useCartSuggestions() {
  const { data: menu } = useMenuQuery()
  const cartStore = useCartStore()

  const inCart = computed(
    () => new Set(cartStore.items.filter((item) => !item.gift).map((item) => item.product_id)),
  )

  return computed(() =>
    (menu.value ?? [])
      .flatMap((category) => category.products ?? [])
      .filter((product) => product.id && !inCart.value.has(product.id))
      .sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular)))
      .filter((product) => product.popular || product.suggested)
      .slice(0, LIMIT),
  )
}
