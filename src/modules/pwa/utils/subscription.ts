import { PushService } from '../api/push.service'
import { base64UrlToBytes } from './base64'

function sameKey(current: ArrayBuffer | null, expected: Uint8Array) {
  if (!current) return false
  const bytes = new Uint8Array(current)
  return bytes.length === expected.length && bytes.every((byte, i) => byte === expected[i])
}

export async function browserSubscription(): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready
  const key = base64UrlToBytes(await PushService.getPublicKey())
  const existing = await registration.pushManager.getSubscription()

  if (existing && sameKey(existing.options.applicationServerKey, key)) return existing
  await existing?.unsubscribe()

  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
}

export async function subscriptionKeys() {
  const { endpoint, keys } = (await browserSubscription()).toJSON()

  return {
    endpoint: endpoint!,
    keys: { p256dh: keys!.p256dh!, auth: keys!.auth! },
  }
}
