import { computed, ref, watch, type Ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import {
  SavedPaymentMethodsService,
  type SavedPaymentMethod,
} from '../api/savedPaymentMethods.service'

export function useSavedPaymentMethods(online: Ref<boolean>) {
  const auth = useAuthStore()
  const branch = useBranchStore()
  const enabled = ref(false)
  const methods = ref<SavedPaymentMethod[]>([])
  const selectedId = ref<string | null>(null)
  const saveNew = ref(false)
  const loading = ref(false)
  const removingId = ref<string | null>(null)
  const error = ref(false)
  let version = 0

  const available = computed(() => online.value && auth.isAuthenticated && enabled.value)
  const selected = computed(() => methods.value.find((method) => method.id === selectedId.value))

  watch(
    [online, () => auth.sessionEpoch, () => auth.client?.id, () => branch.activeBranch?.id],
    async ([isOnline, , clientId, branchId], _previous, onCleanup) => {
      const requestVersion = ++version
      enabled.value = false
      methods.value = []
      selectedId.value = null
      saveNew.value = false
      removingId.value = null
      error.value = false
      loading.value = false
      if (!isOnline || !auth.isAuthenticated || !clientId || !branchId) return

      const controller = new AbortController()
      onCleanup(() => controller.abort())
      loading.value = true
      try {
        const allowed = await SavedPaymentMethodsService.enabled(controller.signal)
        if (requestVersion !== version || !auth.isAuthenticated) return
        enabled.value = allowed
        if (!allowed) return
        const list = await SavedPaymentMethodsService.list(controller.signal)
        if (requestVersion !== version || !auth.isAuthenticated) return
        methods.value = list
      } catch {
        if (requestVersion === version && !controller.signal.aborted) error.value = true
      } finally {
        if (requestVersion === version) loading.value = false
      }
    },
    { immediate: true },
  )

  async function remove(id: string) {
    if (!available.value || removingId.value) return
    const requestVersion = version
    removingId.value = id
    error.value = false
    try {
      await SavedPaymentMethodsService.remove(id)
      if (requestVersion !== version || !available.value) return
      methods.value = methods.value.filter((method) => method.id !== id)
      if (selectedId.value === id) selectedId.value = null
    } catch {
      if (requestVersion === version) error.value = true
    } finally {
      if (requestVersion === version) removingId.value = null
    }
  }

  function useOrdinaryPayment() {
    selectedId.value = null
    saveNew.value = false
  }

  return {
    available,
    methods,
    selected,
    selectedId,
    saveNew,
    loading,
    removingId,
    error,
    remove,
    useOrdinaryPayment,
  }
}
