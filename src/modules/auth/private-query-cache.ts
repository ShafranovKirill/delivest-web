import type { QueryClient } from '@tanstack/vue-query'

export const MY_ORDERS_KEY = ['my-orders'] as const
export const ADDRESSES_KEY = ['addresses'] as const
export const ACTIVE_ORDERS_KEY = ['active-orders'] as const
const LOYALTY_KEY = 'loyalty'

export function identityQueryKey(key: readonly string[], identityId: string | null | undefined) {
  return [...key, identityId ?? 'guest']
}

export function clearPrivateQueries(queryClient: QueryClient, identityId?: string | null) {
  if (!identityId) return

  const keys = [
    [...MY_ORDERS_KEY, identityId],
    [...ADDRESSES_KEY, identityId],
    [...ACTIVE_ORDERS_KEY, identityId],
  ]

  for (const queryKey of keys) {
    void queryClient.cancelQueries({ queryKey, exact: true })
    queryClient.removeQueries({ queryKey, exact: true })
  }

  const loyaltyQuery = {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      query.queryKey[0] === LOYALTY_KEY && query.queryKey[2] === identityId,
  }
  void queryClient.cancelQueries(loyaltyQuery)
  queryClient.removeQueries(loyaltyQuery)

  const notificationsQuery = {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      (query.queryKey[0] === 'customer-notifications' ||
        query.queryKey[0] === 'notification-consents') &&
      query.queryKey[1] === identityId,
  }
  void queryClient.cancelQueries(notificationsQuery)
  queryClient.removeQueries(notificationsQuery)
}
