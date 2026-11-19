import { loadSection } from '@/api/storefront'
import type { paths } from '@/api/types'

type StockApiResponse =
  paths['/client/{branch_id}/stocks']['get']['responses']['200']['content']['application/json']

export type Stock = NonNullable<StockApiResponse['data']>[number]

export const StockService = {
  async getStocks(branchId: string, signal?: AbortSignal): Promise<Stock[]> {
    return loadSection<Stock[]>('stories', branchId, undefined, signal)
  },
}
