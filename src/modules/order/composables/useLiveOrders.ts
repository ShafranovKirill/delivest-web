import { onScopeDispose, watch } from 'vue'
import type { Channel } from 'phoenix'
import { queryClient } from '@/api/client'
import { getSocket, reconnectSocket } from '@/api/socket'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { MY_ORDERS_KEY } from '@/modules/account/composables/useMyOrdersQuery'
import type { ActiveOrder } from '../api/order.service'
import { ACTIVE_ORDERS_KEY } from './useActiveOrdersQuery'

type OrderEvent = { order: ActiveOrder; active: boolean }

function upsertActive(list: ActiveOrder[] | undefined, { order, active }: OrderEvent) {
  if (!list) return list
  const rest = list.filter((item) => item.id !== order.id)
  return active ? [order, ...rest].sort((a, b) => b.inserted_at.localeCompare(a.inserted_at)) : rest
}

function replaceKnown(list: ActiveOrder[] | undefined, { order }: OrderEvent) {
  return list?.map((item) => (item.id === order.id ? order : item))
}

export function useLiveOrders() {
  const authStore = useAuthStore()
  let channel: Channel | null = null
  let joined = false

  getSocket()
    .then((socket) => {
      channel = socket.channel('orders')

      channel.on('order', (event: OrderEvent) => {
        queryClient.setQueryData<ActiveOrder[]>(ACTIVE_ORDERS_KEY, (list) =>
          upsertActive(list, event),
        )
        queryClient.setQueryData<ActiveOrder[]>(MY_ORDERS_KEY, (list) => replaceKnown(list, event))
      })

      channel.join().receive('ok', () => {
        if (joined) queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_KEY })
        joined = true
      })
    })
    .catch((error) => console.error(error))

  watch(
    () => authStore.client?.id ?? null,
    () => reconnectSocket().catch((error) => console.error(error)),
  )

  onScopeDispose(() => channel?.leave())
}
