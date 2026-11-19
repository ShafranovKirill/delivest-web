import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { ref } from 'vue'

const locale = ref<'ru' | 'en'>('ru')
const get = vi.fn()
const useBranchStore = defineStore('menu-locale-test-branch', () => ({
  activeBranch: ref({ id: 'demo-center' }),
}))

vi.mock('@/i18n', () => ({
  i18n: { global: { locale } },
  currentLocale: () => locale.value,
}))
vi.mock('@/api/client', () => ({ api: { get } }))
vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore }))
vi.mock('@tanstack/vue-query', () => ({ useQuery: (options: unknown) => options }))

const { MenuService } = await import('@/modules/menu/api/menu.service')
const { useMenuQuery } = await import('@/modules/menu/composables/useMenuQuery')
const { useStocksQuery } = await import('@/modules/stock/composables/useStocksQuery')
const { rememberWatermark, rememberMenuValidity, renewMenuValidity, invalidateMenuValidity, publicMenuFresh } = await import('@/api/storefront')

beforeEach(() => {
  setActivePinia(createPinia())
  locale.value = 'ru'
  get.mockReset()
})

describe('menu locale', () => {
  it('sends the current locale in the menu request', async () => {
    get.mockResolvedValue({ data: { data: [] } })

    await MenuService.getMenu('branch-1')
    expect(get).toHaveBeenLastCalledWith('/client/branches/branch-1/menu', {
      headers: { 'Accept-Language': 'ru' },
    })

    locale.value = 'en'
    await MenuService.getMenu('branch-1')
    expect(get).toHaveBeenLastCalledWith('/client/branches/branch-1/menu', {
      headers: { 'Accept-Language': 'en' },
    })
  })

  it('changes the menu query key when the locale changes', () => {
    const query = useMenuQuery() as unknown as { queryKey: { value: string[] } }

    expect(query.queryKey.value).toEqual(['menu', 'demo-center', 'ru'])
    locale.value = 'en'
    expect(query.queryKey.value).toEqual(['menu', 'demo-center', 'en'])
  })

  it('a retried old query keeps its original branch and locale', async () => {
    get.mockResolvedValue({ data: { data: [] } })
    const branch = useBranchStore()
    const query = useMenuQuery() as unknown as { queryFn: (context: { queryKey: string[]; signal: AbortSignal }) => Promise<unknown> }
    const signal = new AbortController().signal
    branch.activeBranch = { id: 'another-branch' }
    locale.value = 'en'
    await query.queryFn({ queryKey: ['menu', 'demo-center', 'ru'], signal })
    expect(get).toHaveBeenCalledWith('/client/branches/demo-center/menu', {
      headers: { 'Accept-Language': 'ru' }, signal,
    })
  })

  it('a retried stories query keeps its original branch', async () => {
    get.mockResolvedValue({ data: { data: [] } })
    const query = useStocksQuery() as unknown as { queryFn: (context: { queryKey: string[]; signal: AbortSignal }) => Promise<unknown> }
    const signal = new AbortController().signal
    useBranchStore().activeBranch = { id: 'another-branch' }
    await query.queryFn({ queryKey: ['stocks', 'demo-center'], signal })
    expect(get).toHaveBeenCalledWith('/client/demo-center/stocks', { signal })
  })

  it('does not accept a menu response from an obsolete revision', async () => {
    let resolve!: (value: unknown) => void
    get.mockReturnValue(new Promise(done => { resolve = done }))
    const until = new Date(Date.now() + 20_000).toISOString()
    rememberWatermark('demo-center', { revisions: { menu: 'one' }, valid_until: until })
    const request = MenuService.getMenu('demo-center', 'ru')
    rememberWatermark('demo-center', { revisions: { menu: 'two' }, valid_until: until })
    resolve({ data: { data: [] } })
    await expect(request).rejects.toThrow('Stale menu response')
  })

  it('renews a known complete menu projection only while its revision is unchanged', () => {
    rememberMenuValidity('demo-center', 'ru', new Date(Date.now() - 1_000).toISOString())
    renewMenuValidity('demo-center', 'ru', new Date(Date.now() + 20_000).toISOString())
    expect(publicMenuFresh('demo-center', 'ru')).toBe(true)
    invalidateMenuValidity('demo-center', 'ru')
    renewMenuValidity('demo-center', 'ru', new Date(Date.now() + 20_000).toISOString())
    expect(publicMenuFresh('demo-center', 'ru')).toBe(false)
  })
})
