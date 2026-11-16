import { describe, expect, it, vi } from 'vitest'

const get = vi.hoisted(() => vi.fn())
vi.mock('@/api/client', () => ({ api: { get } }))

import { AccountService } from '@/modules/account/api/account.service'

describe('account orders pagination', () => {
  it('requests six newest orders and passes the continuation cursor', async () => {
    const page = { data: [{ id: 'order-1' }], next_cursor: 'cursor-2' }
    get.mockResolvedValue({ data: page })
    const signal = new AbortController().signal

    await expect(AccountService.getOrders(null, signal)).resolves.toBe(page)
    expect(get).toHaveBeenLastCalledWith('/client/orders', {
      params: { limit: 6 },
      signal,
    })

    await expect(AccountService.getOrders('cursor-1', signal)).resolves.toBe(page)
    expect(get).toHaveBeenLastCalledWith('/client/orders', {
      params: { limit: 6, cursor: 'cursor-1' },
      signal,
    })
  })
})
