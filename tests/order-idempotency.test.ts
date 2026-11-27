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

  it('keeps ordinary payment links and accepts a completed payment without a redirect', async () => {
    post.mockResolvedValueOnce({
      status: 200,
      data: { data: { confirmation_url: 'https://payment.test/confirm' } },
    })
    await expect(OrderService.getPaymentLink('order-1')).resolves.toBe(
      'https://payment.test/confirm',
    )
    expect(post).toHaveBeenLastCalledWith('/client/orders/order-1/pay', {})

    post.mockResolvedValueOnce({ status: 204, data: '' })
    await expect(OrderService.getPaymentLink('order-1', true)).resolves.toBeNull()
    expect(post).toHaveBeenLastCalledWith('/client/orders/order-1/pay', {
      fallback_to_new_method: true,
    })
  })
})
