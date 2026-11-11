import axios from 'axios'
import { getApiBaseUrl } from '@/utils/env'

const sourceApi = axios.create({
  withCredentials: true,
  timeout: 1500,
  headers: { 'Content-Type': 'application/json' },
})

export const SourceClaimService = {
  async claim(accessToken: string, signal: AbortSignal): Promise<void> {
    await sourceApi.post(
      '/client/analytics/source/claim',
      {},
      {
        baseURL: getApiBaseUrl(),
        signal,
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )
  },
}
