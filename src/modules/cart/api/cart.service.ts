import { api } from '@/api/client'
import type { components, paths } from '@/api/types'

export type CartResponse =
  paths['/client/cart']['get']['responses']['200']['content']['application/json']

export type Cart = CartResponse['data']
export type CartItem = Cart['items'][number]
export type FulfillmentType = NonNullable<Cart['fulfillment_type']>

export type PromoCodeState = NonNullable<components['schemas']['PromoCodeState']>
export type PromoRejection = NonNullable<PromoCodeState['reason']>
export type AppliedPromotion = components['schemas']['AppliedPromotion']
export type PromoHint = components['schemas']['PromoHint']
export type PromoReason = components['schemas']['PromoReason']

interface CartQueryParams {
  force?: boolean
  branch_id?: string
}

export const CartService = {
  async getCart(branchId?: string, force: boolean = false): Promise<Cart> {
    const params: CartQueryParams = {}
    if (force) params.force = true
    if (branchId) params.branch_id = branchId

    const { data } = await api.get<CartResponse>('/client/cart', { params })
    return data.data
  },

  async addItem(cartId: string, productId: string): Promise<Cart> {
    const { data } = await api.post<CartResponse>(`/client/cart/${cartId}/items/${productId}`)
    return data.data
  },

  async removeItem(cartId: string, productId: string, all = false): Promise<Cart> {
    const { data } = await api.delete<CartResponse>(`/client/cart/${cartId}/items/${productId}`, {
      params: all ? { all: true } : undefined,
    })
    return data.data
  },

  async repeatOrder(cartId: string, orderId: string): Promise<Cart> {
    const { data } = await api.post<CartResponse>(`/client/cart/${cartId}/repeat/${orderId}`)
    return data.data
  },

  async clearCart(cartId: string): Promise<Cart> {
    const { data } = await api.delete<CartResponse>(`/client/cart/${cartId}/clear`)
    return data.data
  },

  async applyPromoCode(cartId: string, code: string): Promise<Cart> {
    const { data } = await api.post<CartResponse>(`/client/cart/${cartId}/promo_code`, { code })
    return data.data
  },

  async removePromoCode(cartId: string): Promise<Cart> {
    const { data } = await api.delete<CartResponse>(`/client/cart/${cartId}/promo_code`)
    return data.data
  },

  async setFulfillment(cartId: string, fulfillmentType: FulfillmentType): Promise<Cart> {
    const { data } = await api.put<CartResponse>(`/client/cart/${cartId}/context`, {
      fulfillment_type: fulfillmentType,
    })
    return data.data
  },
}
