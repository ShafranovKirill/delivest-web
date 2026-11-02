import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useLocaleStore } from '@/modules/settings/stores/locale.store'
import { PushService } from '../api/push.service'
import { isIos, isStandalone, pushSupported } from '../utils/platform'
import { subscriptionKeys } from '../utils/subscription'

const subscribedOrders = useLocalStorage<string[]>('delivest-push-orders', [])

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
    const { endpoint, keys } = await subscriptionKeys()
    const payload = { endpoint, keys, locale: localeStore.locale }

    await PushService.subscribe(id, payload)

    // The same browser subscription also covers loyalty reminders.
    await PushService.subscribeClient(payload).catch((error) =>
      console.error('[PWA] Client push subscription failed:', error),
    )

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
