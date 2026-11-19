import { expect, it, vi } from 'vitest'

const post = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { event_id: 'event', session_id: 'session' } }))
const create = vi.hoisted(() => vi.fn(() => ({ post })))
vi.mock('axios', () => ({ default: { create } }))
vi.mock('@/utils/env', () => ({ getApiBaseUrl: () => 'https://api.example.test' }))
const { AnalyticsService } = await import('../src/modules/analytics/analytics.service')
const payload = { event_id: 'event', branch_id: 'branch', event: 'cart_add' as const }

it('uses one short credentialed request without adding identity or session fields', async () => {
  const signal = new AbortController().signal
  await AnalyticsService.send(payload, signal, 'token')
  expect(create).toHaveBeenCalledWith(expect.objectContaining({ withCredentials: true, timeout: 1500 }))
  expect(post).toHaveBeenCalledExactlyOnceWith('/client/analytics/events', payload, {
    baseURL: 'https://api.example.test', signal, headers: { Authorization: 'Bearer token' },
  })
  post.mockClear()
  await AnalyticsService.send(payload, signal, null)
  expect(post).toHaveBeenCalledExactlyOnceWith('/client/analytics/events', payload, {
    baseURL: 'https://api.example.test', signal, headers: undefined,
  })
})

it('sends every bounded batch as one credentialed keepalive request', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', fetcher)
  const signal = new AbortController().signal
  await AnalyticsService.sendBatch([payload, payload], signal, 'token')
  expect(fetcher).toHaveBeenCalledExactlyOnceWith('https://api.example.test/client/analytics/events/batch', expect.objectContaining({
    method: 'POST', credentials: 'include', keepalive: true, signal,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    body: JSON.stringify({ events: [payload, payload] }),
  }))
  await expect(AnalyticsService.sendBatch(Array(21).fill(payload), signal, null)).rejects.toThrow('size')
  vi.unstubAllGlobals()
})

it('guest batch uses the same bounded keepalive transport from first dispatch', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', fetcher)
  try {
    const signal = new AbortController().signal
    await AnalyticsService.sendBatch([payload], signal, null)
    expect(fetcher).toHaveBeenCalledExactlyOnceWith('https://api.example.test/client/analytics/events/batch', expect.objectContaining({
      method: 'POST', credentials: 'include', keepalive: true, signal,
      body: JSON.stringify({ events: [payload] }),
    }))
  } finally { vi.unstubAllGlobals() }
})
