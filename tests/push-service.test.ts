import { expect, it, vi } from 'vitest'

const rawDelete = vi.fn()
const apiDelete = vi.fn()
vi.mock('axios', () => ({ default: { delete: rawDelete, post: vi.fn() } }))
vi.mock('@/api/client', () => ({ api: { delete: apiDelete } }))
vi.mock('@/utils/env', () => ({ getApiBaseUrl: () => 'https://api.example' }))
const { PushService } = await import('@/modules/pwa/api/push.service')

it('sends captured A bearer through raw axios even if the current session is B', async () => {
  const currentSession = { accessToken: 'B-token', refresh: vi.fn(), logout: vi.fn() }
  rawDelete.mockRejectedValueOnce(new Error('Offline'))
  await expect(PushService.unsubscribeClient('old-endpoint', 'A-token')).rejects.toThrow('Offline')
  expect(rawDelete).toHaveBeenCalledWith(
    '/client/push',
    expect.objectContaining({
      baseURL: 'https://api.example',
      withCredentials: true,
      headers: { Authorization: 'Bearer A-token' },
      params: { endpoint: 'old-endpoint' },
    }),
  )
  expect(apiDelete).not.toHaveBeenCalled()
  expect(currentSession.accessToken).toBe('B-token')
  expect(currentSession.refresh).not.toHaveBeenCalled()
  expect(currentSession.logout).not.toHaveBeenCalled()
})
