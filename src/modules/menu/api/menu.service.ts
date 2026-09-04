import { api } from '@/api/client'
import type { paths } from '@/api/types'

type MenuApiResponse =
  paths['/client/branches/{branch_id}/menu']['get']['responses']['200']['content']['application/json']

export type MenuCategory = NonNullable<MenuApiResponse['data']>[number]

export type MenuProduct = NonNullable<MenuCategory['products']>[number]

export const MenuService = {
  async getMenu(branchId: string): Promise<MenuCategory[]> {
    const { data } = await api.get<MenuApiResponse>(`/client/branches/${branchId}/menu`)
    return data.data ?? []
  },
}
