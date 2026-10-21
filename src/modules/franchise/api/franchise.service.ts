import { api } from '@/api/client'
import type { paths } from '@/api/types'

type FranchiseResponse =
  paths['/client/franchise']['get']['responses']['200']['content']['application/json']

type DocumentResponse =
  paths['/client/franchise/documents/{kind}']['get']['responses']['200']['content']['application/json']

export type Franchise = FranchiseResponse['data']
export type LegalDocument = DocumentResponse['data']
export type LegalKind = LegalDocument['kind']

export const FranchiseService = {
  async getFranchise(): Promise<Franchise> {
    const { data } = await api.get<FranchiseResponse>('/client/franchise')
    return data.data
  },

  async getDocument(kind: LegalKind): Promise<LegalDocument> {
    const { data } = await api.get<DocumentResponse>(`/client/franchise/documents/${kind}`)
    return data.data
  },
}
