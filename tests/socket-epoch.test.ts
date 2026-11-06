import { expect, it, vi } from 'vitest'

const requests: Array<{ resolve: (value: unknown) => void }> = []
const connections: Array<{
  token: () => string | null
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}> = []
vi.mock('@/api/client', () => ({
  api: { get: vi.fn(() => new Promise((resolve) => requests.push({ resolve }))) },
}))
vi.mock('@/utils/env', () => ({ getApiBaseUrl: () => 'http://localhost:4100' }))
vi.mock('phoenix', () => ({
  Socket: class {
    connect = vi.fn()
    disconnect = vi.fn()
    onError = vi.fn()
    constructor(_url: string, options: { params: () => { token: string | null } }) {
      connections.push({
        token: () => options.params().token,
        connect: this.connect,
        disconnect: this.disconnect,
      })
    }
  },
}))

const { getSocket } = await import('@/api/socket')

it('starts a new epoch socket without waiting for old token and ignores late A token', async () => {
  let current = 1
  const a = getSocket(1, () => current === 1)
  current = 2
  const b = getSocket(2, () => current === 2)
  expect(requests).toHaveLength(2)
  requests[1]!.resolve({ data: { data: { token: 'B' } } })
  await b
  requests[0]!.resolve({ data: { data: { token: 'A' } } })
  await expect(a).rejects.toThrow('Stale socket token response')
  expect(connections).toHaveLength(1)
  expect(connections[0]!.token()).toBe('B')
  expect(connections[0]!.connect).toHaveBeenCalledTimes(1)
})
