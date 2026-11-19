import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { ref } from 'vue'

const locale = ref<'ru' | 'en'>('ru')
const get = vi.fn()
const fetchMock = vi.fn()
const useBranchStore = defineStore('menu-locale-test-branch', () => ({
  activeBranch: ref({ id: 'demo-center' }),
}))

vi.mock('@/i18n', () => ({
  i18n: { global: { locale } },
  currentLocale: () => locale.value,
}))
vi.mock('@/api/client', () => ({ api: { get } }))
vi.mock('@/utils/env', () => ({ getApiBaseUrl: () => 'http://localhost:4000' }))
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
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

function menuResponse(data: unknown[] = []) {
  return new Response(JSON.stringify({ data, valid_until: new Date(Date.now() + 20_000).toISOString() }), { status: 200 })
}

describe('menu locale', () => {
  it('sends the current locale in the menu request', async () => {
    fetchMock.mockImplementation(async () => menuResponse())

    await MenuService.getMenu('branch-1')
    expect(String(fetchMock.mock.lastCall?.[0])).toContain('/client/storefront/v1/sections/menu?branch_id=branch-1&locale=ru')

    locale.value = 'en'
    await MenuService.getMenu('branch-1')
    expect(String(fetchMock.mock.lastCall?.[0])).toContain('/client/storefront/v1/sections/menu?branch_id=branch-1&locale=en')
  })

  it('changes the menu query key when the locale changes', () => {
    const query = useMenuQuery() as unknown as { queryKey: { value: string[] } }

    expect(query.queryKey.value).toEqual(['menu', 'demo-center', 'ru'])
    locale.value = 'en'
    expect(query.queryKey.value).toEqual(['menu', 'demo-center', 'en'])
  })

  it('a retried old query keeps its original branch and locale', async () => {
    fetchMock.mockImplementation(async () => menuResponse())
    const branch = useBranchStore()
    const query = useMenuQuery() as unknown as { queryFn: (context: { queryKey: string[]; signal: AbortSignal }) => Promise<unknown> }
    const signal = new AbortController().signal
    branch.activeBranch = { id: 'another-branch' }
    locale.value = 'en'
    await query.queryFn({ queryKey: ['menu', 'demo-center', 'ru'], signal })
    expect(String(fetchMock.mock.lastCall?.[0])).toContain('branch_id=demo-center&locale=ru')
    expect((fetchMock.mock.lastCall?.[1] as RequestInit).signal).toBeDefined()
  })

  it('a retried stories query keeps its original branch', async () => {
    fetchMock.mockImplementation(async () => menuResponse())
    const query = useStocksQuery() as unknown as { queryFn: (context: { queryKey: string[]; signal: AbortSignal }) => Promise<unknown> }
    const signal = new AbortController().signal
    useBranchStore().activeBranch = { id: 'another-branch' }
    await query.queryFn({ queryKey: ['stocks', 'demo-center'], signal })
    expect(String(fetchMock.mock.lastCall?.[0])).toContain('/sections/stories?branch_id=demo-center')
  })

  it('does not accept a menu response from an obsolete revision', async () => {
    let resolve!: (value: unknown) => void
    fetchMock.mockReturnValue(new Promise(done => { resolve = done }))
    const until = new Date(Date.now() + 20_000).toISOString()
    rememberWatermark('demo-center', { revisions: { menu: 'one' }, valid_until: until })
    const request = MenuService.getMenu('demo-center', 'ru')
    rememberWatermark('demo-center', { revisions: { menu: 'two' }, valid_until: until })
    resolve(menuResponse())
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
