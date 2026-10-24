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
      .filter((product) => product.suggested && product.id && !inCart.value.has(product.id))
      .slice(0, LIMIT),
  )
}
