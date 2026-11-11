import { computed, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { useLocaleStore } from '@/modules/settings/stores/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { PushService } from '../api/push.service'
import { pushSupported } from '../utils/platform'
import {
  pushGeneration,
  pushRegistrationSucceeded,
  subscriptionKeys,
  trackPushRegistration,
} from '../utils/subscription'

export function useLoyaltyPush(active: MaybeRefOrGetter<boolean>) {
  const localeStore = useLocaleStore()
  const authStore = useAuthStore()
  const supported = pushSupported()
  const permission = ref<NotificationPermission>(supported ? Notification.permission : 'denied')
  const pending = ref(false)
  const failed = ref(false)

  async function subscribe() {
    const epoch = authStore.sessionEpoch
    const generation = pushGeneration()
    const token = authStore.accessToken
    if (!token) return
    const { endpoint, keys } = await subscriptionKeys()
    if (authStore.sessionEpoch !== epoch) return
    await trackPushRegistration(
      PushService.subscribeClient({ endpoint, keys, locale: localeStore.locale }, token),
    )
    if (authStore.sessionEpoch !== epoch) return
    await pushRegistrationSucceeded(generation)
  }

  async function enable() {
    if (!supported || pending.value) return

    const epoch = authStore.sessionEpoch
    const token = authStore.accessToken

    pending.value = true
    failed.value = false
    try {
      permission.value = await Notification.requestPermission()
      if (authStore.sessionEpoch !== epoch || authStore.accessToken !== token) return
      if (permission.value === 'granted') await subscribe()
    } catch {
      failed.value = true
    } finally {
      pending.value = false
    }
  }

  function resume() {
    if (!supported || !toValue(active) || permission.value !== 'granted') return
    subscribe().catch(() => {
      failed.value = true
    })
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
