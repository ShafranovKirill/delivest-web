import { expect, it, vi } from 'vitest'
import { createProductLoader } from '../src/modules/menu/composables/productLoader'

it('loads a direct product without depending on the full menu', async () => {
  const fetch = vi.fn().mockResolvedValue({ id: 'product' })
  const receive = vi.fn()
  const state = vi.fn()
  const loader = createProductLoader(fetch, receive, state)
  await loader.load('branch', 'product-slug')
  expect(fetch).toHaveBeenCalledWith('branch', 'product-slug', expect.any(AbortSignal))
  expect(receive).toHaveBeenCalledWith({ id: 'product' })
  expect(state.mock.calls).toEqual([['loading'], ['idle']])
})

it('a closed modal never reopens from a late response even if transport ignores abort', async () => {
  let resolve!: (value: { id: string }) => void
  const fetch = vi.fn(() => new Promise<{ id: string }>(done => { resolve = done }))
  const receive = vi.fn()
  const state = vi.fn()
  const loader = createProductLoader(fetch, receive, state)
  const pending = loader.load('branch-a', 'product')
  loader.cancel()
  resolve({ id: 'old' })
  await pending
  expect(fetch.mock.calls[0]?.[2].aborted).toBe(true)
  expect(receive).not.toHaveBeenCalled()
  expect(state.mock.calls).toEqual([['loading']])
})

it('branch changes discard stale errors and missing products differ from retryable errors', async () => {
  let reject!: (reason: unknown) => void
  const fetch = vi.fn()
    .mockImplementationOnce(() => new Promise((_done, fail) => { reject = fail }))
    .mockResolvedValueOnce({ id: 'new' })
    .mockRejectedValueOnce({ response: { status: 404 } })
    .mockRejectedValueOnce(new Error('offline'))
  const receive = vi.fn()
  const state = vi.fn()
  const loader = createProductLoader(fetch, receive, state)
  const old = loader.load('branch-a', 'product')
  await loader.load('branch-b', 'product')
  reject(new Error('late'))
  await old
  expect(receive).toHaveBeenCalledExactlyOnceWith({ id: 'new' })
  expect(state).not.toHaveBeenCalledWith('error')
  await loader.load('branch-b', 'missing')
  expect(state).toHaveBeenLastCalledWith('unavailable')
  await loader.load('branch-b', 'retry')
  expect(state).toHaveBeenLastCalledWith('error')
})
