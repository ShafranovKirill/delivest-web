import { beforeEach, expect, it, vi } from 'vitest'

vi.mock('@/utils/env', () => ({ getApiBaseUrl: () => 'http://localhost:4000' }))
vi.mock('@/i18n', () => ({ currentLocale: () => 'ru' }))

const { loadSection, loadSectionResponse } = await import('@/api/storefront')

function sectionResponse(data: unknown, tag: string) {
  return new Response(JSON.stringify({ data, revision: '1', valid_until: '2030-01-01T00:00:00Z' }), {
    status: 200,
    headers: { etag: tag, 'content-type': 'application/json' },
  })
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn()))

it('reuses data after 304 and sends a validator only when cached', async () => {
  const fetchMock = vi.mocked(fetch)
  fetchMock.mockResolvedValueOnce(sectionResponse(['first'], 'W/"one"'))
    .mockResolvedValueOnce(new Response(null, { status: 304, headers: { 'x-storefront-valid-until': '2031-01-01T00:00:00Z' } }))
  expect(await loadSection<string[]>('menu', 'branch-one', 'ru')).toEqual(['first'])
  expect(await loadSectionResponse<string[]>('menu', 'branch-one', 'ru')).toEqual({
    data: ['first'], validUntil: '2031-01-01T00:00:00Z',
  })
  expect((fetchMock.mock.calls[0]?.[1] as RequestInit).headers).toBeUndefined()
  expect((fetchMock.mock.calls[1]?.[1] as RequestInit).headers).toEqual({ 'If-None-Match': 'W/"one"' })
})

it('retries an unexpected 304 once without returning missing data', async () => {
  const fetchMock = vi.mocked(fetch)
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 304 }))
    .mockResolvedValueOnce(new Response(null, { status: 304 }))
  await expect(loadSection('branches')).rejects.toThrow('304 without cached data')
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('isolates locale and branch validators', async () => {
  const fetchMock = vi.mocked(fetch)
  fetchMock.mockImplementation(async () => sectionResponse([], 'W/"distinct"'))
  await loadSection('menu', 'branch-two', 'ru')
  await loadSection('menu', 'branch-two', 'en')
  await loadSection('menu', 'branch-three', 'ru')
  expect(fetchMock.mock.calls.every(([, init]) => !(init?.headers as Record<string, string> | undefined)?.['If-None-Match'])).toBe(true)
})

it('does not publish an older response after a newer request', async () => {
  const fetchMock = vi.mocked(fetch)
  let resolveOld!: (value: Response) => void
  fetchMock.mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve }))
    .mockResolvedValueOnce(sectionResponse(['new'], 'W/"new"'))
    .mockResolvedValueOnce(new Response(null, { status: 304 }))
  const old = loadSection<string[]>('stories', 'branch-race').catch(error => error)
  expect(await loadSection<string[]>('stories', 'branch-race')).toEqual(['new'])
  resolveOld(sectionResponse(['old'], 'W/"old"'))
  expect(await old).toBeInstanceOf(Error)
  expect(await loadSection<string[]>('stories', 'branch-race')).toEqual(['new'])
  expect((fetchMock.mock.calls[2]?.[1] as RequestInit).headers).toEqual({ 'If-None-Match': 'W/"new"' })
})

it('rejects an aborted response even if a fetch mock resolves later', async () => {
  const fetchMock = vi.mocked(fetch)
  let resolve!: (value: Response) => void
  fetchMock.mockReturnValueOnce(new Promise(done => { resolve = done }))
  const controller = new AbortController()
  const pending = loadSection('advertising', 'branch-abort', undefined, controller.signal)
  controller.abort()
  resolve(sectionResponse({}, 'W/"aborted"'))
  await expect(pending).rejects.toThrow('Superseded')
})
