import { api } from '@/api/client'
import { loadSection } from '@/api/storefront'
import { storefrontReadsEnabled } from '@/api/storefrontPolicy'
import type { paths } from '@/api/types'

type StockApiResponse =
  paths['/client/{branch_id}/stocks']['get']['responses']['200']['content']['application/json']

export type Stock = NonNullable<StockApiResponse['data']>[number]

export const StockService = {
  async getStocks(branchId: string, signal?: AbortSignal): Promise<Stock[]> {
    if (storefrontReadsEnabled(branchId)) return loadSection<Stock[]>('stories', branchId, undefined, signal)
    const { data } = await api.get<StockApiResponse>(`/client/${branchId}/stocks`, { signal })
    return data.data ?? []
  },
}
