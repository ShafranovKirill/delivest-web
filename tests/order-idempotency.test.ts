import { describe, expect, it, vi } from 'vitest'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('@/api/client', () => ({ api: { post } }))

const { OrderService } = await import('@/modules/order/api/order.service')

describe('order checkout request', () => {
  it('sends the cart key in the header and the quoted revision in the body', async () => {
    post.mockResolvedValueOnce({ data: { data: { id: 'order-1' } } })
    const payload = {
      branch_id: 'branch-1',
      cart_id: 'cart-1',
      cart_revision: 'revision-1',
    }

    await expect(OrderService.createOrder(payload, 'cart-1')).resolves.toEqual({ id: 'order-1' })
    expect(post).toHaveBeenCalledWith('/client/orders', payload, {
      headers: { 'Idempotency-Key': 'cart-1' },
    })
  })
})
