import type { MenuProduct } from '../api/menu.service'

export type ProductTag = NonNullable<MenuProduct['tags']>[number]

export const tagText: Record<ProductTag, string> = {
  hit: 'text-orange-600',
  new: 'text-primary',
  spicy: 'text-red-600',
  vegetarian: 'text-green-700',
}

export const tagSoft: Record<ProductTag, string> = {
  hit: 'bg-orange-50',
  new: 'bg-primary-soft',
  spicy: 'bg-red-50',
  vegetarian: 'bg-green-50',
}
