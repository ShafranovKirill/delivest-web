import { effectScope, nextTick, reactive, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = reactive({
  isAuthenticated: false,
  sessionEpoch: 0,
  client: null as { id: string } | null,
})
const branch = reactive({ activeBranch: { id: 'branch-a' } })
const enabled = vi.fn()
const list = vi.fn()
const remove = vi.fn()

vi.mock('@/modules/auth/stores/auth.store', () => ({ useAuthStore: () => auth }))
vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('@/modules/order/api/savedPaymentMethods.service', () => ({
  SavedPaymentMethodsService: { enabled, list, remove },
}))

const { useSavedPaymentMethods } =
  await import('@/modules/order/composables/useSavedPaymentMethods')

const flush = async () => {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.isAuthenticated = false
  auth.client = null
  auth.sessionEpoch++
  branch.activeBranch = { id: 'branch-a' }
  enabled.mockResolvedValue(true)
  list.mockResolvedValue([{ id: 'method-a', title: 'Visa', type: 'bank_card', last4: '4242' }])
  remove.mockResolvedValue(undefined)
})

describe('saved payment methods in checkout', () => {
  it('does not request or reveal methods to a guest', async () => {
    const scope = effectScope()
    const state = scope.run(() => useSavedPaymentMethods(ref(true)))!
    await flush()
    expect(enabled).not.toHaveBeenCalled()
    expect(state.available.value).toBe(false)
    expect(state.methods.value).toEqual([])
    scope.stop()
  })

  it('clears methods and consent on logout and ignores a late response', async () => {
    let resolveList!: (value: unknown[]) => void
    list.mockReturnValueOnce(new Promise((resolve) => (resolveList = resolve)))
    auth.isAuthenticated = true
    auth.client = { id: 'client-a' }
    const scope = effectScope()
    const state = scope.run(() => useSavedPaymentMethods(ref(true)))!
    await flush()
    state.saveNew.value = true
    auth.isAuthenticated = false
    auth.client = null
    auth.sessionEpoch++
    await flush()
    resolveList([{ id: 'method-a', title: 'Visa', type: 'bank_card', last4: '4242' }])
    await flush()
    expect(state.available.value).toBe(false)
    expect(state.methods.value).toEqual([])
    expect(state.saveNew.value).toBe(false)
    scope.stop()
  })

  it('removes a selected method without losing ordinary payment and permits deletion after branch change', async () => {
    auth.isAuthenticated = true
    auth.client = { id: 'client-a' }
    const scope = effectScope()
    const state = scope.run(() => useSavedPaymentMethods(ref(true)))!
    await flush()
    state.selectedId.value = 'method-a'
    await state.remove('method-a')
    expect(remove).toHaveBeenCalledWith('method-a')
    expect(state.selectedId.value).toBeNull()
    expect(state.available.value).toBe(true)

    branch.activeBranch = { id: 'branch-b' }
    await flush()
    expect(state.methods.value).toHaveLength(1)
    expect(state.removingId.value).toBeNull()
    scope.stop()
  })
})
