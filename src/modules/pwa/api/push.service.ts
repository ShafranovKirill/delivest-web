import { api } from '@/api/client'
import axios from 'axios'
import { getApiBaseUrl } from '@/utils/env'
import type { components, paths } from '@/api/types'

type PushKeyResponse =
  paths['/client/push/key']['get']['responses']['200']['content']['application/json']

export type PushSubscriptionPayload = components['schemas']['PushSubscriptionRequest']

let publicKey: Promise<string> | null = null

export const PushService = {
  getPublicKey(): Promise<string> {
    publicKey ??= api
      .get<PushKeyResponse>('/client/push/key')
      .then(({ data }) => data.data.public_key)
    publicKey.catch(() => (publicKey = null))
    return publicKey
  },

  async subscribe(
    orderId: string,
    payload: PushSubscriptionPayload,
    accessToken: string | null,
  ): Promise<void> {
    await axios.post(`/client/orders/${orderId}/push`, payload, {
      baseURL: getApiBaseUrl(),
      timeout: 10000,
      withCredentials: true,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })
  },

  async subscribeClient(payload: PushSubscriptionPayload, accessToken: string): Promise<void> {
    await axios.post('/client/push', payload, {
      baseURL: getApiBaseUrl(),
      timeout: 10000,
      withCredentials: true,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  },

  async unsubscribeClient(endpoint: string, accessToken: string): Promise<void> {
    await axios.delete('/client/push', {
      baseURL: getApiBaseUrl(),
      timeout: 10000,
      withCredentials: true,
      params: { endpoint },
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  },
}
