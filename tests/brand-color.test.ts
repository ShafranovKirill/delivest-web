import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const getFranchise = vi.fn()
vi.mock('@/modules/franchise/api/franchise.service', () => ({
  FranchiseService: { getFranchise },
}))

const { useFranchiseStore } = await import('@/modules/franchise/stores/franchise.store')

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => (resolve = done))
  return { promise, resolve }
}

beforeEach(() => {
  setActivePinia(createPinia())
  getFranchise.mockReset()
})

describe('franchise bootstrap', () => {
  it('waits for the fresh API value even when a franchise was restored from storage', async () => {
    const request = deferred<{ primary_color: string; dark_primary_color: string }>()
    getFranchise.mockReturnValue(request.promise)
    const store = useFranchiseStore()
    store.franchise = {
      primary_color: '#111111',
      dark_primary_color: '#222222',
    } as typeof store.franchise

    let settled = false
    const init = store.init().then(() => (settled = true))
    await Promise.resolve()
    expect(settled).toBe(false)
    expect(store.primaryColor).toBe('#111111')

    request.resolve({ primary_color: '#abcdef', dark_primary_color: '#fedcba' })
    await init
    expect(store.primaryColor).toBe('#abcdef')
    expect(store.darkPrimaryColor).toBe('#fedcba')
  })

  it('keeps the cached franchise when the API fails', async () => {
    getFranchise.mockRejectedValue(new Error('offline'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const store = useFranchiseStore()
    store.franchise = { primary_color: '#111111' } as typeof store.franchise
    await store.init()
    expect(store.primaryColor).toBe('#111111')
    error.mockRestore()
  })
})
