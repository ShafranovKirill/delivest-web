import axios from 'axios'
import { getApiBaseUrl } from '@/utils/env'
import type { components } from '@/api/types'

export type AnalyticsPayload = components['schemas']['FunnelEventRequest']
export type FunnelEvent = AnalyticsPayload['event']

const analyticsApi = axios.create({
  withCredentials: true,
  timeout: 1500,
  headers: { 'Content-Type': 'application/json' },
})

export const AnalyticsService = {
  async send(payload: AnalyticsPayload, signal: AbortSignal, accessToken: string | null): Promise<void> {
    await analyticsApi.post('/client/analytics/events', payload, {
      baseURL: getApiBaseUrl(),
      signal,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })
  },
}
