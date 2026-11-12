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
})
