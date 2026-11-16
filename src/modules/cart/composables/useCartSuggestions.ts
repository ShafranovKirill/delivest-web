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

  return computed(() => {
    const seen = new Set<string>()

    return (menu.value ?? [])
      .flatMap((category) => category.products ?? [])
      .filter((product) => {
        const id = product.id
        if (
          !id ||
          inCart.value.has(id) ||
          !(product.popular || product.suggested) ||
          seen.has(id)
        ) {
          return false
        }
        seen.add(id)
        return true
      })
      .sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular)))
      .slice(0, LIMIT)
  })
}
