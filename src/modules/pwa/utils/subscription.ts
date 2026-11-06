import { PushService } from '../api/push.service'
import { base64UrlToBytes } from './base64'

const CACHE_NAME = 'delivest-push-privacy-v1'
const BLOCK_KEY = '/__delivest_push_blocked__'
let flagQueue: Promise<unknown> = Promise.resolve()
let cleanupBarrier: Promise<void> = Promise.resolve()
let blockingFailure = false
let identityGeneration = 0
let freshEndpoint: string | null = null
const pendingRegistrations = new Set<Promise<unknown>>()

export function pushGeneration() {
  return identityGeneration
}

export function trackPushRegistration<T>(promise: Promise<T>): Promise<T> {
  pendingRegistrations.add(promise)
  void promise.finally(() => pendingRegistrations.delete(promise)).catch(() => undefined)
  return promise
}

function queueFlag(action: () => Promise<void>): Promise<void> {
  const next = flagQueue.catch(() => undefined).then(action)
  flagQueue = next
  return next
}

async function appRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  const registration = await navigator.serviceWorker.getRegistration('/')
  const script =
    registration?.active?.scriptURL ??
    registration?.waiting?.scriptURL ??
    registration?.installing?.scriptURL
  return script && new URL(script).pathname === '/sw.js' ? registration : undefined
}

async function blockNotifications(
  registration: ServiceWorkerRegistration | undefined,
): Promise<void> {
  try {
    await queueFlag(async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(BLOCK_KEY, new Response('blocked'))
    })
  } catch (error) {
    // Unregister only our worker if persistent storage cannot protect notifications.
    if (!registration || !(await registration.unregister())) throw error
    blockingFailure = true
  }
}

function privacyAwareWorkerAcknowledged(
  registration: ServiceWorkerRegistration | undefined,
): Promise<boolean> {
  const worker = registration?.active
  if (!worker || typeof MessageChannel === 'undefined') return Promise.resolve(false)
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    const finish = (acknowledged: boolean) => {
      clearTimeout(timeout)
      channel.port1.close()
      channel.port2.close()
      resolve(acknowledged)
    }
    const timeout = setTimeout(() => finish(false), 500)
    channel.port1.onmessage = (event) => finish(event.data?.type === 'delivest-push-block-ack')
    try {
      worker.postMessage({ type: 'delivest-push-block' }, [channel.port2])
    } catch {
      finish(false)
    }
  })
}

async function closeNotifications(registration: ServiceWorkerRegistration | undefined) {
  if (!registration) return
  const notifications = await registration.getNotifications()
  notifications.forEach((notification) => notification.close())
}

async function unsubscribeOld(
  registration: ServiceWorkerRegistration | undefined,
): Promise<string | null> {
  if (!registration) return null
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return null
  const endpoint = subscription.endpoint
  const removed = await subscription.unsubscribe()
  if (!removed && (await registration.pushManager.getSubscription())) {
    throw new Error('Push subscription could not be removed')
  }
  return endpoint
}

/** Starts a fail-closed transition. Only the durable block must precede auth state changes. */
export async function beginPushIdentityChange(
  oldAccessToken: string | null,
  reportError: () => void,
): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  identityGeneration++
  freshEndpoint = null
  const registration = await appRegistration()
  await blockNotifications(registration)
  if (blockingFailure) reportError()
  try {
    await closeNotifications(registration)
  } catch {
    reportError()
    throw new Error('Existing notifications could not be closed')
  }
  const acknowledged = !blockingFailure && (await privacyAwareWorkerAcknowledged(registration))
  let endpointBeforeBoundary: string | null = null
  if (!acknowledged) {
    try {
      endpointBeforeBoundary = await unsubscribeOld(registration)
      await closeNotifications(registration)
      if (registration && !(await registration.unregister())) {
        throw new Error('Legacy push worker could not be unregistered')
      }
      if (registration) {
        blockingFailure = true
        reportError()
      }
    } catch {
      reportError()
      throw new Error('Legacy push worker could not be made safe')
    }
  }
  const previous = cleanupBarrier
  cleanupBarrier = previous
    .catch(() => undefined)
    .then(async () => {
      let endpoint: string | null = endpointBeforeBoundary
      try {
        if (acknowledged) endpoint = await unsubscribeOld(registration)
      } catch {
        reportError()
        throw new Error('Old push subscription remains active')
      }
      if (endpoint && oldAccessToken) {
        const capturedEndpoint = endpoint
        void Promise.allSettled([...pendingRegistrations]).then(() =>
          PushService.unsubscribeClient(capturedEndpoint, oldAccessToken).catch(() =>
            reportError(),
          ),
        )
      }
    })
  void cleanupBarrier.catch(() => undefined)
}

async function isBlocked(): Promise<boolean> {
  await flagQueue.catch(() => undefined)
  if (blockingFailure) return true
  try {
    return Boolean(await (await caches.open(CACHE_NAME)).match(BLOCK_KEY))
  } catch {
    // The worker also drops pushes if it cannot read this cache.
    return true
  }
}

/** Clear the block only after the new identity's server registration succeeds. */
export async function pushRegistrationSucceeded(generation: number): Promise<void> {
  if (blockingFailure || generation !== identityGeneration) return
  await queueFlag(async () => {
    if (generation !== identityGeneration) return
    await (await caches.open(CACHE_NAME)).delete(BLOCK_KEY)
    if (generation === identityGeneration) {
      const registration = await appRegistration()
      if (generation === identityGeneration) {
        registration?.active?.postMessage({ type: 'delivest-push-unblock' })
      }
    }
  })
}

function sameKey(current: ArrayBuffer | null, expected: Uint8Array) {
  if (!current) return false
  const bytes = new Uint8Array(current)
  return bytes.length === expected.length && bytes.every((byte, i) => byte === expected[i])
}

export async function browserSubscription(): Promise<PushSubscription> {
  const generation = identityGeneration
  await cleanupBarrier
  if (blockingFailure || generation !== identityGeneration) throw new Error('Push identity changed')
  const blocked = await isBlocked()
  const registration = await navigator.serviceWorker.ready
  const key = base64UrlToBytes(await PushService.getPublicKey())
  if (generation !== identityGeneration) throw new Error('Push identity changed')
  const existing = await registration.pushManager.getSubscription()
  if (generation !== identityGeneration) throw new Error('Push identity changed')

  if (
    existing &&
    sameKey(existing.options.applicationServerKey, key) &&
    (!blocked || existing.endpoint === freshEndpoint)
  )
    return existing
  if (existing) {
    const removed = await existing.unsubscribe()
    if (!removed && (await registration.pushManager.getSubscription())) {
      throw new Error('Old push subscription remains active')
    }
  }
  const created = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  })
  if (generation !== identityGeneration) {
    await created.unsubscribe()
    throw new Error('Push identity changed')
  }
  freshEndpoint = created.endpoint
  return created
}

export async function subscriptionKeys() {
  const { endpoint, keys } = (await browserSubscription()).toJSON()
  return {
    endpoint: endpoint!,
    keys: { p256dh: keys!.p256dh!, auth: keys!.auth! },
  }
}
