import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useLocaleStore } from '@/modules/settings/stores/locale.store'
import { PushService } from '../api/push.service'
import { base64UrlToBytes } from '../utils/base64'
import { isIos, isStandalone, pushSupported } from '../utils/platform'

const subscribedOrders = useLocalStorage<string[]>('delivest-push-orders', [])

function sameKey(current: ArrayBuffer | null, expected: Uint8Array) {
  if (!current) return false
  const bytes = new Uint8Array(current)
  return bytes.length === expected.length && bytes.every((byte, i) => byte === expected[i])
}

async function browserSubscription(): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready
  const key = base64UrlToBytes(await PushService.getPublicKey())
  const existing = await registration.pushManager.getSubscription()

  if (existing && sameKey(existing.options.applicationServerKey, key)) return existing
  await existing?.unsubscribe()

  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
}

export function useOrderPush(orderId: MaybeRefOrGetter<string | null | undefined>) {
  const localeStore = useLocaleStore()
  const supported = pushSupported()
  const needsInstall = isIos() && !isStandalone()
  const permission = ref<NotificationPermission>(supported ? Notification.permission : 'denied')
  const pending = ref(false)
  const failed = ref(false)

  const enabled = computed(() => {
    const id = toValue(orderId)
    return !!id && subscribedOrders.value.includes(id)
  })

  async function send(id: string) {
    const { endpoint, keys } = (await browserSubscription()).toJSON()
    await PushService.subscribe(id, {
      endpoint: endpoint!,
      keys: { p256dh: keys!.p256dh!, auth: keys!.auth! },
      locale: localeStore.locale,
    })
    subscribedOrders.value = [...subscribedOrders.value.slice(-19), id]
  }

  async function enable() {
    const id = toValue(orderId)
    if (!id || !supported || pending.value) return

    pending.value = true
    failed.value = false
    try {
      permission.value = await Notification.requestPermission()
      if (permission.value === 'granted') await send(id)
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error)
      failed.value = true
    } finally {
      pending.value = false
    }
  }

  async function resume() {
    const id = toValue(orderId)
    if (id && supported && permission.value === 'granted' && !enabled.value)
      await send(id).catch((error) => console.error('[PWA] Push resubscribe failed:', error))
  }

  return { supported, needsInstall, permission, pending, failed, enabled, enable, resume }
}
