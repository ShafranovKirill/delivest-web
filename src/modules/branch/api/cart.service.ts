import { api } from '@/api/client'
import type { paths } from '@/api/types'

export type CartResponse =
  paths['/client/cart']['get']['responses']['200']['content']['application/json']

export type Cart = CartResponse['data']
export type CartItem = Cart['items'][number]

export const CartService = {
  async getCart(force = false): Promise<Cart> {
    const { data } = await api.get<CartResponse>('/client/cart', {
      params: force ? { force: true } : undefined,
    })
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
}
