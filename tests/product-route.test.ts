import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { effectScope, nextTick, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
const getProduct = vi.hoisted(() => vi.fn())
const route = reactive({ params: {} as Record<string, string>, query: {} as Record<string, string> })
const branch = reactive({ activeBranch: { id: 'branch-a' } })
const router = { push: vi.fn().mockResolvedValue(undefined), replace: vi.fn().mockResolvedValue(undefined), back: vi.fn() }
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => router,
  isNavigationFailure: (result: { cancelled?: boolean } | undefined) => result?.cancelled === true,
}))
vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('@/modules/menu/api/menu.service', () => ({ MenuService: { getProduct } }))
import { useMenuStore } from '../src/modules/menu/stores/menu.store'
import { useProductRoute } from '../src/modules/menu/composables/useProductRoute'
const scopes: ReturnType<typeof effectScope>[] = []
const flush = async () => { await nextTick(); await Promise.resolve(); await nextTick() }

beforeEach(() => {
  setActivePinia(createPinia())
  route.params = { slug: 'center', productKey: 'pizza' }
  route.query = { yclid: '123' }
  branch.activeBranch.id = 'branch-a'
  getProduct.mockReset()
  router.push.mockClear(); router.replace.mockClear(); router.back.mockClear()
})
afterEach(() => { for (const scope of scopes.splice(0)) scope.stop() })
function open() {
  const scope = effectScope()
  scopes.push(scope)
  scope.run(useProductRoute)
  return useMenuStore()
}

it('direct path loads and closes inside the existing menu while retaining the source query', async () => {
  getProduct.mockResolvedValue({ id: 'product-a', slug: 'pizza' })
  const menu = open()
  expect(menu.productLoadState).toBe('loading')
  expect(menu.isProductModalOpen).toBe(true)
  await flush()
  expect(menu.activeProduct?.id).toBe('product-a')
  menu.closeProductModal()
  expect(router.replace).toHaveBeenCalledWith({ name: 'menu', params: { slug: 'center' }, query: { yclid: '123' } })
})

it('closing during point loading prevents a late response from reopening the card', async () => {
  let resolve!: (value: unknown) => void
  getProduct.mockReturnValue(new Promise(done => { resolve = done }))
  const menu = open()
  menu.closeProductModal()
  resolve({ id: 'product-a', slug: 'pizza' })
  await flush()
  expect(menu.activeProduct).toBeNull()
  expect(menu.isProductModalOpen).toBe(false)
})

it('closing a card before its URL push completes returns to the menu', async () => {
  route.params = { slug: 'center' }
  let finishPush!: () => void
  router.push.mockImplementationOnce(({ query }: { query: Record<string, string> }) =>
    new Promise<void>(resolve => {
      finishPush = () => { route.query = query; resolve() }
    }),
  )
  const menu = open()
  menu.openProductModal({ id: 'product-a', slug: 'pizza' })
  expect(router.push).toHaveBeenCalledOnce()
  menu.closeProductModal()
  finishPush()
  await flush()
  expect(router.back).toHaveBeenCalledOnce()
  expect(menu.isProductModalOpen).toBe(false)
})

it('an aborted card URL push does not navigate back from the menu', async () => {
  route.params = { slug: 'center' }
  router.push.mockResolvedValueOnce({ cancelled: true })
  const menu = open()
  menu.openProductModal({ id: 'product-a', slug: 'pizza' })
  menu.closeProductModal()
  await flush()
  expect(router.back).not.toHaveBeenCalled()
  expect(menu.isProductModalOpen).toBe(false)
})

it('old query UUID links work and a matching slug in another branch still reloads the product', async () => {
  route.params = { slug: 'center' }
  route.query = { product: 'product-a' }
  getProduct.mockResolvedValueOnce({ id: 'product-a', slug: 'pizza' }).mockResolvedValueOnce({ id: 'product-b', slug: 'pizza' })
  const menu = open()
  await flush()
  expect(getProduct).toHaveBeenCalledWith('branch-a', 'product-a', expect.any(AbortSignal))
  branch.activeBranch.id = 'branch-b'
  await flush()
  expect(getProduct).toHaveBeenCalledWith('branch-b', 'product-a', expect.any(AbortSignal))
  expect(menu.activeProduct?.id).toBe('product-b')
})

it('a temporary error is retryable without relying on menu data', async () => {
  getProduct.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ id: 'product-a', slug: 'pizza' })
  const menu = open()
  await flush()
  expect(menu.productLoadState).toBe('error')
  menu.retryProduct?.()
  await flush()
  expect(menu.productLoadState).toBe('idle')
  expect(menu.activeProduct?.id).toBe('product-a')
})
