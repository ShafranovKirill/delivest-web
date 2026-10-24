import { api } from '@/api/client'
import type { paths } from '@/api/types'

type RunningPromotionsResponse =
  paths['/client/{branch_id}/promotions']['get']['responses']['200']['content']['application/json']

export type RunningPromotion = RunningPromotionsResponse['data'][number]

export const PromotionService = {
  async getRunning(branchId: string): Promise<RunningPromotion[]> {
    const { data } = await api.get<RunningPromotionsResponse>(`/client/${branchId}/promotions`)
    return data.data
  },
}
