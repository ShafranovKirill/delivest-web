import { expect, it, vi } from 'vitest'
import { reactive, effectScope } from 'vue'

const auth = reactive({ sessionEpoch: 1, accessToken: 'A-token' as string | null })
const subscriptionKeys = vi.fn()
const subscribeClient = vi.fn()
let grant!: (permission: NotificationPermission) => void

Object.defineProperty(globalThis, 'Notification', {
  configurable: true,
  value: {
    permission: 'default',
    requestPermission: vi.fn(() => new Promise<NotificationPermission>((resolve) => { grant = resolve })),
  },
})

vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/settings/stores/locale.store', () => ({ useLocaleStore: () => ({ locale: 'ru' }) }))
vi.mock('@/modules/pwa/api/push.service', () => ({ PushService: { subscribeClient } }))
vi.mock('@/modules/pwa/utils/platform', () => ({ pushSupported: () => true }))
vi.mock('@/modules/pwa/utils/subscription', () => ({
  subscriptionKeys,
  pushGeneration: () => 0,
  pushRegistrationSucceeded: vi.fn(),
  trackPushRegistration: (promise: unknown) => promise,
}))

const { useLoyaltyPush } = await import('@/modules/pwa/composables/useLoyaltyPush')

it('does not register marketing push for a new account after an old permission prompt resolves', async () => {
  const scope = effectScope()
  const push = scope.run(() => useLoyaltyPush(false))!
  const pending = push.enable()
  auth.sessionEpoch = 2
  auth.accessToken = 'B-token'
  grant('granted')
  await pending
  expect(subscriptionKeys).not.toHaveBeenCalled()
  expect(subscribeClient).not.toHaveBeenCalled()
  scope.stop()
})
