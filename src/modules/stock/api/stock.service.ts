import { api } from '@/api/client'
import type { paths } from '@/api/types'

type StockApiResponse =
  paths['/client/{branch_id}/stocks']['get']['responses']['200']['content']['application/json']

export type Stock = NonNullable<StockApiResponse['data']>[number]

export const StockService = {
  async getStocks(branchId: string, signal?: AbortSignal): Promise<Stock[]> {
    const { data } = await api.get<StockApiResponse>(`/client/${branchId}/stocks`, { signal })
    return data.data ?? []
  },
}
