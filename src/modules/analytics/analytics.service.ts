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
  async sendBatch(payloads: AnalyticsPayload[], signal: AbortSignal, accessToken: string | null): Promise<void> {
    if (!payloads.length || payloads.length > 20) throw new Error('Invalid funnel batch size')
    const body = JSON.stringify({ events: payloads })
    if (body.length > 12_000) throw new Error('Funnel batch too large')
    const url = `${getApiBaseUrl().replace(/\/$/, '')}/client/analytics/events/batch`
    const response = await fetch(url, {
      method: 'POST', credentials: 'include', keepalive: true, signal,
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body,
    })
    if (!response.ok) throw new Error(`Funnel batch failed: ${response.status}`)
  },
}
