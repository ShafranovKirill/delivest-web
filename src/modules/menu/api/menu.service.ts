import { api } from '@/api/client'
import { currentLocale } from '@/i18n'
import { queryClient } from '@/api/client'
import { previousWatermark, publicMenuFresh, rememberMenuValidity } from '@/api/storefront'
import type { paths } from '@/api/types'

type MenuApiResponse =
  paths['/client/branches/{branch_id}/menu']['get']['responses']['200']['content']['application/json']

export type MenuCategory = NonNullable<MenuApiResponse['data']>[number]

export type MenuProduct = NonNullable<MenuCategory['products']>[number]

export const MenuService = {
  async getProduct(branchId: string, productKey: string, signal?: AbortSignal): Promise<MenuProduct> {
    const categories = publicMenuFresh(branchId, currentLocale())
      ? queryClient.getQueryData<MenuCategory[]>(['menu', branchId, currentLocale()]) : undefined
    const cached = categories?.flatMap(category => category.products ?? [])
      .find(product => product.id === productKey || product.slug === productKey)
    if (cached) return cached
    const { data } = await api.get<{ data: MenuProduct }>(
      `/client/branches/${encodeURIComponent(branchId)}/products/${encodeURIComponent(productKey)}`,
      { signal, headers: { 'Accept-Language': currentLocale() } },
    )
    return data.data
  },
  async getMenu(branchId: string, locale: string = currentLocale(), signal?: AbortSignal): Promise<MenuCategory[]> {
    const revision = previousWatermark(branchId)?.revisions.menu
    const { data } = await api.get<MenuApiResponse>(`/client/branches/${branchId}/menu`, {
      headers: { 'Accept-Language': locale }, signal,
    })
    const watermark = previousWatermark(branchId)
    if (revision !== watermark?.revisions.menu) throw new Error('Stale menu response')
    if (watermark && Date.parse(watermark.valid_until) > Date.now())
      rememberMenuValidity(branchId, locale, watermark.valid_until)
    return data.data ?? []
  },
}
