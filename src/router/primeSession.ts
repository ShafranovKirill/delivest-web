import { loadPrivateSession } from '@/api/storefront'
import { queryClient } from '@/api/client'
import { identityQueryKey, ACTIVE_ORDERS_KEY } from '@/modules/auth/private-query-cache'
import { seedSocketToken } from '@/api/socket'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { OrderService } from '@/modules/order/api/order.service'

let lastStartedKey: string | null = null

export function primeSession() {
  const branch = useBranchStore().activeBranch
  if (!branch) return
  const auth = useAuthStore()
  if (auth.sessionChanging) return
  const cartStore = useCartStore()
  const cartRevision = cartStore.revision
  const epoch = auth.sessionEpoch
  const identity = auth.client?.id ?? null
  const accessToken = auth.accessToken ?? null
  const key = JSON.stringify([branch.id, epoch, identity, accessToken])
  if (lastStartedKey === key) return
  lastStartedKey = key
  const isCurrent = () => auth.sessionEpoch === epoch && useBranchStore().activeBranch?.id === branch.id &&
    (auth.client?.id ?? null) === identity && (auth.accessToken ?? null) === accessToken && !auth.sessionChanging
  void loadPrivateSession(branch.id, epoch).then(session => {
    if (!isCurrent()) return
    if (cartStore.revision === cartRevision) cartStore.setSessionCart(session.cart)
    queryClient.setQueryData(identityQueryKey(ACTIVE_ORDERS_KEY, identity), session.active_orders, { updatedAt: Date.now() })
    seedSocketToken(session.socket_token, epoch)
  }).catch(() => {
    if (!isCurrent()) return
    // A failed private bootstrap must not leave the mounted menu with an empty cart.
    // Existing endpoints provide a bounded one-shot recovery; normal startup has no extra calls.
    if (cartStore.revision === cartRevision && !cartStore.isInitialized) {
      void cartStore.fetchCart(branch.id).catch(console.error)
    }
    void queryClient.fetchQuery({
      queryKey: identityQueryKey(ACTIVE_ORDERS_KEY, identity),
      queryFn: () => OrderService.getActiveOrders(),
      staleTime: Infinity,
    }).catch(console.error)
  })
}
