import { api } from '@/api/client'

export interface SavedPaymentMethod {
  id: string
  type: string
  title: string
  last4: string | null
}

export const SavedPaymentMethodsService = {
  async enabled(signal?: AbortSignal): Promise<boolean> {
    const { data } = await api.get<{ saved_payment_methods_enabled?: boolean }>(
      '/client/capabilities',
      { signal },
    )
    return data.saved_payment_methods_enabled === true
  },

  async list(signal?: AbortSignal): Promise<SavedPaymentMethod[]> {
    const { data } = await api.get<{ data: SavedPaymentMethod[] }>('/client/payment-methods', {
      signal,
    })
    return data.data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/client/payment-methods/${encodeURIComponent(id)}`)
  },
}
