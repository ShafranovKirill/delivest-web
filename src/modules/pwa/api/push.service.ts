import { api } from '@/api/client'
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

  async subscribe(orderId: string, payload: PushSubscriptionPayload): Promise<void> {
    await api.post(`/client/orders/${orderId}/push`, payload)
  },
}
