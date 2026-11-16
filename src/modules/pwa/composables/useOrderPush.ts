import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useLocaleStore } from '@/modules/settings/stores/locale.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { PushService } from '../api/push.service'
import { isIos, isStandalone, pushSupported } from '../utils/platform'
import {
  pushGeneration,
  pushRegistrationSucceeded,
  subscriptionKeys,
  trackPushRegistration,
} from '../utils/subscription'

try {
  localStorage.removeItem('delivest-push-orders')
} catch {
  /* Legacy IDs had no owner. */
}
const subscribedOrders = useLocalStorage<{ owner: string; ids: string[] }>(
  'delivest-push-orders:v2',
  { owner: 'guest', ids: [] },
)

export function useOrderPush(orderId: MaybeRefOrGetter<string | null | undefined>) {
  const localeStore = useLocaleStore()
  const authStore = useAuthStore()
  const supported = pushSupported()
  const needsInstall = isIos() && !isStandalone()
  const permission = ref<NotificationPermission>(supported ? Notification.permission : 'denied')
  const pending = ref(false)
  const failed = ref(false)
  const owner = computed(() => authStore.client?.id ?? 'guest')
  let allowedOwner = owner.value
  let revoked = false
  watch(
    owner,
    (next, previous) => {
      if (allowedOwner === 'guest' && previous === 'guest' && next !== 'guest') allowedOwner = next
      else if (next !== allowedOwner) revoked = true
    },
    { flush: 'sync' },
  )

  function syncOwner() {
    if (subscribedOrders.value.owner === owner.value) return
    subscribedOrders.value = {
      owner: owner.value,
      ids: subscribedOrders.value.owner === 'guest' ? subscribedOrders.value.ids : [],
    }
  }
  watch(owner, syncOwner, { immediate: true, flush: 'sync' })

  const enabled = computed(() => {
    const id = toValue(orderId)
    return (
      !revoked &&
      !!id &&
      subscribedOrders.value.owner === owner.value &&
      subscribedOrders.value.ids.includes(id)
    )
  })

  async function send(id: string) {
    if (revoked) return
    const epoch = authStore.sessionEpoch
    const generation = pushGeneration()
    const token = authStore.accessToken
    const isCurrent = () => authStore.sessionEpoch === epoch
    const { endpoint, keys } = await subscriptionKeys()
    if (!isCurrent()) return
    const payload = { endpoint, keys, locale: localeStore.locale }

    await trackPushRegistration(PushService.subscribe(id, payload, token))
    if (!isCurrent()) return
    if (token) await trackPushRegistration(PushService.subscribeClient(payload, token))
    if (!isCurrent()) return
    await pushRegistrationSucceeded(generation)
    if (!isCurrent()) return
    syncOwner()
    subscribedOrders.value = {
      owner: owner.value,
      ids: [...subscribedOrders.value.ids.slice(-19), id],
    }
  }

  async function enable() {
    const id = toValue(orderId)
    if (!id || !supported || pending.value) return

    pending.value = true
    failed.value = false
    try {
      permission.value = await Notification.requestPermission()
      if (permission.value === 'granted') await send(id)
    } catch {
      failed.value = true
    } finally {
      pending.value = false
    }
  }

  async function resume() {
    const id = toValue(orderId)
    if (!revoked && id && supported && permission.value === 'granted' && !enabled.value)
      await send(id).catch(() => {
        failed.value = true
      })
  }

  return { supported, needsInstall, permission, pending, failed, enabled, enable, resume }
}
