import { effectScope, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { auth, invalidateQueries, setQueryData, handler } = vi.hoisted(() => ({
  auth: { sessionEpoch: 0, client: { id: 'client-1' } as { id: string } | null },
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  handler: { current: undefined as ((event: unknown) => void) | undefined },
}))
const channel = vi.hoisted(() => ({
  on: vi.fn((_name: string, callback: (event: unknown) => void) => {
    handler.current = callback
    return 1
  }),
  off: vi.fn(),
  leave: vi.fn(),
  join: vi.fn(() => ({ receive: vi.fn() })),
}))
const socket = vi.hoisted(() => ({ channel: vi.fn(() => channel) }))

vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/api/client', () => ({
  queryClient: { invalidateQueries, setQueryData },
}))
vi.mock('@/api/socket', () => ({
  getSocket: vi.fn(async () => socket),
  reconnectSocket: vi.fn(async () => undefined),
}))

import { useLiveOrders } from '@/modules/order/composables/useLiveOrders'

describe('live order envelope', () => {
  beforeEach(() => {
    invalidateQueries.mockClear()
    setQueryData.mockClear()
    handler.current = undefined
    auth.sessionEpoch = 0
    auth.client = { id: 'client-1' }
  })

  it('resyncs identity-scoped orders on unknown versions without applying payload', async () => {
    const scope = effectScope()
    scope.run(() => useLiveOrders())
    await nextTick()
    await nextTick()

    expect(handler.current).toBeDefined()
    handler.current?.({ v: 2, order: { id: 'stale' }, active: true })
    expect(setQueryData).not.toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['active-orders', 'client-1'],
    })
    scope.stop()
  })

  it.each([undefined, 1])('accepts legacy or v1 order event (%s)', async (v) => {
    const scope = effectScope()
    scope.run(() => useLiveOrders())
    await nextTick()
    await nextTick()

    handler.current?.({
      v,
      order: { id: 'order-1', inserted_at: '2026-11-07T00:00:00Z' },
      active: true,
    })
    expect(setQueryData).toHaveBeenCalled()
    scope.stop()
  })

  it('does not resync an old identity after an epoch change', async () => {
    const scope = effectScope()
    scope.run(() => useLiveOrders())
    await nextTick()
    await nextTick()
    auth.sessionEpoch = 1

    handler.current?.({ v: 2, order: { id: 'stale' }, active: true })
    expect(invalidateQueries).not.toHaveBeenCalled()
    scope.stop()
  })
})
