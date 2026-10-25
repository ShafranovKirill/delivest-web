import type { MenuProduct } from '../api/menu.service'

export type ProductTag = NonNullable<MenuProduct['tags']>[number]
