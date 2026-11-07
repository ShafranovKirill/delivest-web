import { onScopeDispose, watch } from 'vue'
import type { Channel } from 'phoenix'
import { queryClient } from '@/api/client'
import { getSocket, reconnectSocket } from '@/api/socket'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { identityQueryKey } from '@/modules/auth/private-query-cache'
import { LOYALTY_KEY } from '@/modules/account/composables/useLoyaltyQuery'
import { MY_ORDERS_KEY } from '@/modules/account/composables/useMyOrdersQuery'
import type { ActiveOrder } from '../api/order.service'
import { ACTIVE_ORDERS_KEY } from './useActiveOrdersQuery'

type OrderEvent = { v?: number; order: ActiveOrder; active: boolean }

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
  let orderHandlerRef: number | null = null
  let joined = false
  let active = true
  let channelVersion = 0

  function leaveChannel() {
    if (!channel) return
    if (orderHandlerRef !== null) channel.off('order', orderHandlerRef)
    channel.leave()
    channel = null
    orderHandlerRef = null
    joined = false
  }

  async function connectChannel(identityId: string | null, epoch: number) {
    const version = ++channelVersion
    leaveChannel()
    try {
      const isCurrent = () => authStore.sessionEpoch === epoch
      const socket = await getSocket(epoch, isCurrent)
      if (!active || version !== channelVersion) return
      await reconnectSocket(epoch, isCurrent)
      if (
        !active ||
        version !== channelVersion ||
        authStore.sessionEpoch !== epoch ||
        (authStore.client?.id ?? null) !== identityId
      ) {
        return
      }

      const nextChannel = socket.channel('orders')
      channel = nextChannel
      orderHandlerRef = nextChannel.on('order', (event: OrderEvent) => {
        if (
          !active ||
          version !== channelVersion ||
          authStore.sessionEpoch !== epoch ||
          (authStore.client?.id ?? null) !== identityId
        )
          return
        if (event.v !== undefined && event.v !== 1) {
          queryClient.invalidateQueries({
            queryKey: identityQueryKey(ACTIVE_ORDERS_KEY, identityId),
          })
          if (identityId) {
            queryClient.invalidateQueries({
              queryKey: identityQueryKey(MY_ORDERS_KEY, identityId),
            })
          }
          queryClient.invalidateQueries({ queryKey: [LOYALTY_KEY] })
          return
        }
        queryClient.invalidateQueries({ queryKey: [LOYALTY_KEY] })
        queryClient.setQueryData<ActiveOrder[]>(
          identityQueryKey(ACTIVE_ORDERS_KEY, identityId),
          (list) => upsertActive(list, event),
        )
        if (identityId) {
          queryClient.setQueryData<ActiveOrder[]>(
            identityQueryKey(MY_ORDERS_KEY, identityId),
            (list) => replaceKnown(list, event),
          )
        }
      })

      nextChannel.join().receive('ok', () => {
        if (!active || version !== channelVersion || authStore.sessionEpoch !== epoch) return
        if (joined) queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_KEY })
        joined = true
      })
    } catch (error) {
      if (active && version === channelVersion) console.error(error)
    }
  }

  watch(
    [() => authStore.client?.id ?? null, () => authStore.sessionEpoch],
    ([identityId, epoch]) => {
      void connectChannel(identityId, epoch)
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    active = false
    channelVersion++
    leaveChannel()
  })
}
