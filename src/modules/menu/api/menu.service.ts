import { api } from '@/api/client'
import { currentLocale } from '@/i18n'
import type { paths } from '@/api/types'

type MenuApiResponse =
  paths['/client/branches/{branch_id}/menu']['get']['responses']['200']['content']['application/json']

export type MenuCategory = NonNullable<MenuApiResponse['data']>[number]

export type MenuProduct = NonNullable<MenuCategory['products']>[number]

export const MenuService = {
  async getProduct(branchId: string, productKey: string, signal?: AbortSignal): Promise<MenuProduct> {
    const { data } = await api.get<{ data: MenuProduct }>(
      `/client/branches/${encodeURIComponent(branchId)}/products/${encodeURIComponent(productKey)}`,
      { signal, headers: { 'Accept-Language': currentLocale() } },
    )
    return data.data
  },
  async getMenu(branchId: string): Promise<MenuCategory[]> {
    const { data } = await api.get<MenuApiResponse>(`/client/branches/${branchId}/menu`, {
      headers: { 'Accept-Language': currentLocale() },
    })
    return data.data ?? []
  },
}
