import { api } from '@/api/client'
import type { paths } from '@/api/types'

export type BranchListResponse =
  paths['/client/branches']['get']['responses']['200']['content']['application/json']

export type Branch = BranchListResponse['data'][number]

export type BranchResponse =
  paths['/client/branches/{id}/select']['post']['responses']['200']['content']['application/json']

export type BranchSlugResponse =
  paths['/client/branches/slug/{slug}/select']['post']['responses']['200']['content']['application/json']

export const BranchService = {
  async getBranches(): Promise<Branch[]> {
    const { data } = await api.get<BranchListResponse>('/client/branches')
    return data.data
  },

  async selectBranch(id: string): Promise<Branch> {
    const { data } = await api.post<BranchResponse>(`/client/branches/${id}/select`)
    return data.data
  },

  async selectBranchBySlug(slug: string): Promise<Branch> {
    const { data } = await api.post<BranchSlugResponse>(`/client/branches/slug/${slug}/select`)
    return data.data
  },

  async clearActive(): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>('/client/branches/active')
    return data
  },
}
