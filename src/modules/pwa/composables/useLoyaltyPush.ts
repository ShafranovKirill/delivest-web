import { computed, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { useLocaleStore } from '@/modules/settings/stores/locale.store'
import { PushService } from '../api/push.service'
import { pushSupported } from '../utils/platform'
import { subscriptionKeys } from '../utils/subscription'

export function useLoyaltyPush(active: MaybeRefOrGetter<boolean>) {
  const localeStore = useLocaleStore()
  const supported = pushSupported()
  const permission = ref<NotificationPermission>(supported ? Notification.permission : 'denied')
  const pending = ref(false)
  const failed = ref(false)

  async function subscribe() {
    const { endpoint, keys } = await subscriptionKeys()
    await PushService.subscribeClient({ endpoint, keys, locale: localeStore.locale })
  }

  async function enable() {
    if (!supported || pending.value) return

    pending.value = true
    failed.value = false
    try {
      permission.value = await Notification.requestPermission()
      if (permission.value === 'granted') await subscribe()
    } catch (error) {
      console.error('[PWA] Loyalty push subscription failed:', error)
      failed.value = true
    } finally {
      pending.value = false
    }
  }

  function resume() {
    if (!supported || !toValue(active) || permission.value !== 'granted') return
    subscribe().catch((error) => console.error('[PWA] Loyalty push resubscribe failed:', error))
  }

  watch(() => toValue(active), resume, { immediate: true })

  return {
    supported,
    permission,
    pending,
    failed,
    enabled: computed(() => permission.value === 'granted'),
    enable,
  }
}
