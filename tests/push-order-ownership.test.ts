import { expect, it, vi } from 'vitest'
import { effectScope, reactive, ref, nextTick } from 'vue'

const auth = reactive<{
  client: { id: string } | null
  sessionEpoch: number
  accessToken: string | null
}>({
  client: null,
  sessionEpoch: 0,
  accessToken: null,
})
const removeItem = vi.fn()
const subscriptionKeys = vi.fn()
Object.defineProperty(globalThis, 'Notification', {
  configurable: true,
  value: { permission: 'granted' },
})
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { removeItem } })
let stored = ref<{ owner: string; ids: string[] }>({ owner: 'guest', ids: [] })
vi.mock('@vueuse/core', () => ({
  useLocalStorage: (_key: string, initial: { owner: string; ids: string[] }) => {
    stored = ref(initial)
    return stored
  },
}))
vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/settings/stores/locale.store', () => ({
  useLocaleStore: () => ({ locale: 'ru' }),
}))
vi.mock('@/modules/pwa/api/push.service', () => ({ PushService: {} }))
vi.mock('@/modules/pwa/utils/subscription', () => ({
  subscriptionKeys,
  pushGeneration: () => 0,
  pushRegistrationSucceeded: vi.fn(),
  trackPushRegistration: (value: unknown) => value,
}))
vi.mock('@/modules/pwa/utils/platform', () => ({
  pushSupported: () => true,
  isIos: () => false,
  isStandalone: () => false,
}))

const { useOrderPush } = await import('@/modules/pwa/composables/useOrderPush')

it('discards legacy IDs, transfers guest orders on first login, and clears A IDs before B', async () => {
  auth.client = null
  stored.value = { owner: 'guest', ids: ['guest-order'] }
  const id = ref('guest-order')
  const scope = effectScope()
  const push = scope.run(() => useOrderPush(id))!
  expect(removeItem).toHaveBeenCalledWith('delivest-push-orders')
  expect(push.enabled.value).toBe(true)
  auth.client = { id: 'A' }
  await nextTick()
  expect(push.enabled.value).toBe(true)
  stored.value = { owner: 'A', ids: ['A-order'] }
  id.value = 'A-order'
  expect(push.enabled.value).toBe(true)
  auth.client = null
  await nextTick()
  expect(push.enabled.value).toBe(false)
  auth.client = { id: 'B' }
  await nextTick()
  expect(push.enabled.value).toBe(false)
  expect(stored.value).toEqual({ owner: 'B', ids: [] })
  await push.resume()
  expect(subscriptionKeys).not.toHaveBeenCalled()
  scope.stop()
})
