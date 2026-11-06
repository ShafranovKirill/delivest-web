import { beforeEach, expect, it, vi } from 'vitest'

const getPublicKey = vi.fn(async () => 'AQID')
const unsubscribeClient = vi.fn(async () => undefined)
vi.mock('@/modules/pwa/api/push.service', () => ({
  PushService: { getPublicKey, unsubscribeClient },
}))

const entries = new Map<string, Response>()
const messages: unknown[] = []
let current: {
  endpoint: string
  options: { applicationServerKey: ArrayBuffer }
  unsubscribe: ReturnType<typeof vi.fn>
  toJSON: () => unknown
} | null
let removed: ReturnType<typeof vi.fn>
let subscribe: ReturnType<typeof vi.fn>
let closed: ReturnType<typeof vi.fn>
let acknowledge = true
const registration = {
  active: {
    scriptURL: 'https://shop.example/sw.js',
    postMessage: (message: unknown, ports: MessagePort[] = []) => {
      messages.push(message)
      if (acknowledge) ports[0]?.postMessage({ type: 'delivest-push-block-ack' })
    },
  },
  pushManager: {
    getSubscription: vi.fn(async () => current),
    subscribe: vi.fn(),
  },
  getNotifications: vi.fn(async () => [{ close: closed }]),
  unregister: vi.fn(async () => true),
}

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { PushManager: class {} },
})
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: {
    serviceWorker: {
      ready: Promise.resolve(registration),
      getRegistration: vi.fn(async () => registration),
      controller: { postMessage: (message: unknown) => messages.push(message) },
    },
  },
})
Object.defineProperty(globalThis, 'caches', {
  configurable: true,
  value: {
    open: vi.fn(async () => ({
      put: async (key: string, value: Response) => {
        entries.set(key, value)
      },
      match: async (key: string) => entries.get(key),
      delete: async (key: string) => entries.delete(key),
    })),
  },
})

let push: typeof import('@/modules/pwa/utils/subscription')

function makeSubscription(endpoint: string) {
  removed = vi.fn(async () => {
    current = null
    return true
  })
  return {
    endpoint,
    options: { applicationServerKey: new Uint8Array([1, 2, 3]).buffer },
    unsubscribe: removed,
    toJSON: () => ({ endpoint, keys: { p256dh: 'key', auth: 'auth' } }),
  }
}

beforeEach(async () => {
  vi.resetModules()
  push = await import('@/modules/pwa/utils/subscription')
  entries.clear()
  acknowledge = true
  messages.length = 0
  getPublicKey.mockClear()
  unsubscribeClient.mockReset().mockResolvedValue(undefined)
  closed = vi.fn()
  subscribe = vi.fn(async () => {
    current = makeSubscription('new-endpoint')
    return current
  })
  registration.pushManager.subscribe = subscribe
  registration.pushManager.getSubscription.mockClear()
  current = makeSubscription('old-endpoint')
})

it('waits for actual unsubscribe before changing identity with a legacy worker', async () => {
  acknowledge = false
  let finish!: () => void
  const pending = new Promise<void>((resolve) => {
    finish = resolve
  })
  current!.unsubscribe = vi.fn(async () => {
    await pending
    current = null
    return true
  })
  let resolved = false
  const transition = push.beginPushIdentityChange('A-token', vi.fn()).then(() => {
    resolved = true
  })
  await vi.waitFor(() => expect(entries.has('/__delivest_push_blocked__')).toBe(true))
  await new Promise((resolve) => setTimeout(resolve, 550))
  expect(resolved).toBe(false)
  finish()
  await transition
  expect(resolved).toBe(true)
  expect(current).toBeNull()
  expect(registration.unregister).toHaveBeenCalled()
})

it('rejects an identity change if a legacy worker ignores block and unsubscribe fails', async () => {
  acknowledge = false
  current!.unsubscribe = vi.fn(async () => false)
  const report = vi.fn()
  await expect(push.beginPushIdentityChange('A-token', report)).rejects.toThrow(
    'Legacy push worker',
  )
  expect(report).toHaveBeenCalled()
  expect(entries.has('/__delivest_push_blocked__')).toBe(true)
})

it('blocks before identity change, removes old endpoint, and uses captured A bearer after pending work', async () => {
  let finish!: () => void
  const pending = new Promise<void>((resolve) => {
    finish = resolve
  })
  push.trackPushRegistration(pending)
  const oldUnsubscribe = current!.unsubscribe
  const report = vi.fn()
  await push.beginPushIdentityChange('A-token', report)
  expect(entries.has('/__delivest_push_blocked__')).toBe(true)
  expect(closed).toHaveBeenCalledTimes(1)
  const newSubscription = await push.browserSubscription()
  expect(oldUnsubscribe).toHaveBeenCalledTimes(1)
  expect(newSubscription.endpoint).toBe('new-endpoint')
  expect(unsubscribeClient).not.toHaveBeenCalled()
  finish()
  await vi.waitFor(() => expect(unsubscribeClient).toHaveBeenCalledWith('old-endpoint', 'A-token'))
  expect(entries.has('/__delivest_push_blocked__')).toBe(true)
  await push.pushRegistrationSucceeded(push.pushGeneration())
  expect(entries.has('/__delivest_push_blocked__')).toBe(false)
  expect(messages.at(-1)).toEqual({ type: 'delivest-push-unblock' })
  expect(report).not.toHaveBeenCalled()
})

it('keeps browser push blocked when old subscription cannot be removed', async () => {
  current = makeSubscription('old-endpoint')
  current.unsubscribe = vi.fn(async () => false)
  const report = vi.fn()
  await push.beginPushIdentityChange('A-token', report)
  await expect(push.browserSubscription()).rejects.toThrow()
  expect(entries.has('/__delivest_push_blocked__')).toBe(true)
  expect(subscribe).not.toHaveBeenCalled()
  expect(report).toHaveBeenCalled()
})

it('accepts unsubscribe false only when the browser has no old subscription', async () => {
  current = makeSubscription('old-endpoint')
  current.unsubscribe = vi.fn(async () => {
    current = null
    return false
  })
  const report = vi.fn()
  await push.beginPushIdentityChange('A-token', report)
  const b = await push.browserSubscription()
  expect(b.endpoint).toBe('new-endpoint')
  expect(report).not.toHaveBeenCalled()
})

it('reports a failed A DELETE without reviving its endpoint or blocking B subscription', async () => {
  unsubscribeClient.mockRejectedValueOnce(new Error('Network unavailable'))
  const report = vi.fn()
  await push.beginPushIdentityChange('A-token', report)
  const b = await push.browserSubscription()
  expect(b.endpoint).toBe('new-endpoint')
  await vi.waitFor(() => expect(report).toHaveBeenCalled())
  expect(unsubscribeClient).toHaveBeenCalledWith('old-endpoint', 'A-token')
  expect(entries.has('/__delivest_push_blocked__')).toBe(true)
})

it('does not create A subscription after a late key response', async () => {
  let finish!: (key: string) => void
  getPublicKey.mockImplementationOnce(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve
      }),
  )
  const old = push.browserSubscription()
  await vi.waitFor(() => expect(getPublicKey).toHaveBeenCalled())
  await push.beginPushIdentityChange('A-token', vi.fn())
  finish('AQID')
  await expect(old).rejects.toThrow('Push identity changed')
  expect(subscribe).not.toHaveBeenCalled()
})
