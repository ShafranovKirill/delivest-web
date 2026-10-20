import { api } from '@/api/client'
import type { components } from '@/api/types'

export type ClientProfile = components['schemas']['ClientProfile']
export type ClientSession = components['schemas']['ClientSession']
export type CallConfirmation = components['schemas']['StartCallResponse']['data']

type Envelope<T> = { data: T }

export const AuthService = {
  async startCall(phone: string): Promise<CallConfirmation> {
    const { data } = await api.post<Envelope<CallConfirmation>>('/client/auth/call', { phone })
    return data.data
  },

  async completeCall(confirmationId: string): Promise<ClientSession> {
    const { data } = await api.post<Envelope<ClientSession>>(
      `/client/auth/call/${confirmationId}/complete`,
    )
    return data.data
  },

  async refresh(refreshToken: string): Promise<ClientSession> {
    const { data } = await api.post<Envelope<ClientSession>>('/client/auth/refresh', {
      refresh_token: refreshToken,
    })
    return data.data
  },
}
