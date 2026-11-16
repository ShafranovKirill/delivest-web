import { api } from '@/api/client'

export type Notice = {
  id: string
  title: string
  body: string
  cta: { type: 'apply_promo' | 'show_bonus'; value: string } | null
  expires_at: string | null
  created_at: string
}

export type Consent = { sms: boolean; push: boolean }
export type Capabilities = { in_app: boolean; push: boolean; sms: boolean }

export const NotificationsService = {
  async list(branchId: string, deviceId: string, cursor: string | null, signal?: AbortSignal) {
    const { data } = await api.get<{ data: Notice[]; next_cursor: string | null }>(
      '/client/notifications',
      { params: { branch_id: branchId, device_id: deviceId, cursor }, signal },
    )
    return data
  },
  async dismiss(branchId: string, deviceId: string, noticeId: string) {
    await api.post(`/client/notifications/${noticeId}/dismiss`, {
      branch_id: branchId,
      device_id: deviceId,
    })
  },
  async click(branchId: string, deviceId: string, noticeId: string) {
    await api.post(`/client/notifications/${noticeId}/click`, {
      branch_id: branchId,
      device_id: deviceId,
    })
  },
  async consents(branchId: string, signal?: AbortSignal) {
    const { data } = await api.get<{ data: Consent; capabilities: Capabilities }>(
      '/client/notifications/consents',
      { params: { branch_id: branchId }, signal },
    )
    return data
  },
  async updateConsents(branchId: string, values: Partial<Consent>) {
    const { data } = await api.put<{ data: Consent; capabilities: Capabilities }>(
      '/client/notifications/consents',
      { ...values, branch_id: branchId },
    )
    return data
  },
}
