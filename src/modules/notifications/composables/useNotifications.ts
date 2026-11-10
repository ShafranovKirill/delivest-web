import { computed } from 'vue'
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { NotificationsService } from '../api/notifications.service'

const DEVICE_KEY = 'delivest:notifications:device_id'
export const NOTICES_KEY = 'customer-notifications'
export const CONSENTS_KEY = 'notification-consents'

export function notificationDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function useNotificationScope() {
  const auth = useAuthStore()
  const branch = useBranchStore()
  const enabled = computed(
    () =>
      auth.isAuthenticated &&
      Boolean((branch.activeBranch?.branch_info as { notifications_enabled?: boolean } | undefined)?.notifications_enabled),
  )
  const branchId = computed(() => branch.activeBranch?.id ?? '')
  const identity = computed(() => auth.client?.id ?? 'guest')
  const epoch = computed(() => auth.sessionEpoch)
  return { auth, branchId, identity, epoch, enabled }
}

export function useNotices() {
  const scope = useNotificationScope()
  const deviceId = computed(() => scope.enabled.value ? notificationDeviceId() : '')
  const query = useInfiniteQuery({
    queryKey: computed(() => [NOTICES_KEY, scope.identity.value, scope.epoch.value, scope.branchId.value, deviceId.value]),
    queryFn: ({ signal, pageParam }) => NotificationsService.list(scope.branchId.value, deviceId.value, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: scope.enabled,
    refetchInterval: () => scope.enabled.value && document.visibilityState === 'visible' ? 60_000 : false,
    staleTime: 30_000,
  })
  return { ...query, ...scope, deviceId }
}

export function useNotificationConsents() {
  const scope = useNotificationScope()
  const query = useQuery({
    queryKey: computed(() => [CONSENTS_KEY, scope.identity.value, scope.epoch.value, scope.branchId.value]),
    queryFn: ({ signal }) => NotificationsService.consents(scope.branchId.value, signal),
    enabled: scope.enabled,
  })
  return { ...query, ...scope }
}
