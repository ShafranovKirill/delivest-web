import { getApiBaseUrl } from '@/utils/env'
import { currentLocale } from '@/i18n'
import type { Franchise } from '@/modules/franchise/api/franchise.service'
import type { Branch } from '@/modules/branch/api/branch.service'
import type { MenuCategory } from '@/modules/menu/api/menu.service'
import type { Stock } from '@/modules/stock/api/stock.service'
import type { AdvertisingConfig } from '@/modules/analytics/metrika'
import type { Cart } from '@/modules/cart/api/cart.service'
import type { ActiveOrder } from '@/modules/order/api/order.service'

export type StorefrontBranch = Pick<Branch, 'id' | 'slug' | 'name' | 'is_active'> &
  Partial<Branch>
export type Storefront = {
  schema_version: number
  locale: string
  revisions: Record<string, string | number>
  valid_until: string
  franchise: Franchise
  branches: StorefrontBranch[]
  selected_branch: Branch | null
  menu: MenuCategory[] | null
  stories: Stock[] | null
  advertising: AdvertisingConfig | null
}
export type PrivateSession = {
  cart: Cart | null
  active_orders: ActiveOrder[]
  socket_token: string
}

// Fetch is isolated from the authenticated axios client and omits same-origin cookies.
async function publicGet<T>(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const url = new URL(path, `${getApiBaseUrl().replace(/\/$/, '')}/`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const boundedSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000)
  const response = await fetch(url, { credentials: 'omit', signal: boundedSignal })
  if (!response.ok) throw new Error(`Storefront request failed: ${response.status}`)
  return response.json() as Promise<T>
}
const publicPending = new Map<string, { controller: AbortController; promise: Promise<Storefront> }>()
let privatePending: { branchId: string; epoch: number; promise: Promise<PrivateSession> } | null = null
let advertisingSeed: { branchId: string; until: number; config: AdvertisingConfig } | null = null
const menuValidity = new Map<string, number>()
export type StorefrontWatermark = { revisions: Record<string, string | number>; valid_until: string; section?: string; advertising?: AdvertisingConfig | null }
const watermarks = new Map<string, StorefrontWatermark>()

type SectionName = 'franchise' | 'branches' | 'menu' | 'stories' | 'advertising'
type SectionEntry = { etag: string; data: unknown; validUntil: string }
const sectionCache = new Map<string, SectionEntry>()
const sectionGenerations = new Map<string, number>()
let nextSectionGeneration = 0

function rememberSection(key: string, entry: SectionEntry) {
  sectionCache.delete(key)
  sectionCache.set(key, entry)
  if (sectionCache.size > 32) sectionCache.delete(sectionCache.keys().next().value!)
}

export async function loadSectionResponse<T>(section: SectionName, branchId?: string, locale?: string, signal?: AbortSignal): Promise<{ data: T; validUntil: string }> {
  const scopedBranch = section === 'franchise' || section === 'branches' ? '' : branchId ?? ''
  const scopedLocale = section === 'menu' ? locale ?? currentLocale() : ''
  const key = `${section}:${scopedBranch}:${scopedLocale}`
  const generation = ++nextSectionGeneration
  sectionGenerations.set(key, generation)
  const cached = sectionCache.get(key)
  const url = new URL(`/client/storefront/v1/sections/${section}`, `${getApiBaseUrl().replace(/\/$/, '')}/`)
  if (scopedBranch) url.searchParams.set('branch_id', scopedBranch)
  if (scopedLocale) url.searchParams.set('locale', scopedLocale)
  const boundedSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000)

  async function request(entry?: SectionEntry, retried = false): Promise<{ data: T; validUntil: string }> {
    const response = await fetch(url, {
      credentials: 'omit', signal: boundedSignal,
      headers: entry ? { 'If-None-Match': entry.etag } : undefined,
    })
    if (sectionGenerations.get(key) !== generation || boundedSignal.aborted)
      throw new Error('Superseded storefront section response')
    if (response.status === 304) {
      if (!entry) {
        if (retried) throw new Error('Storefront section returned 304 without cached data')
        return request(undefined, true)
      }
      const validUntil = response.headers.get('x-storefront-valid-until')
      if (validUntil) rememberSection(key, { ...entry, validUntil })
      return { data: entry.data as T, validUntil: validUntil ?? entry.validUntil }
    }
    if (!response.ok) throw new Error(`Storefront section request failed: ${response.status}`)
    const body = await response.json() as { data: T; valid_until: string }
    if (sectionGenerations.get(key) !== generation || boundedSignal.aborted)
      throw new Error('Superseded storefront section response')
    const etag = response.headers.get('etag')
    if (etag) {
      rememberSection(key, { etag, data: body.data, validUntil: body.valid_until })
    }
    return { data: body.data, validUntil: body.valid_until }
  }

  try {
    return await request(cached)
  } finally {
    if (sectionGenerations.get(key) === generation) sectionGenerations.delete(key)
  }
}

export async function loadSection<T>(section: SectionName, branchId?: string, locale?: string, signal?: AbortSignal): Promise<T> {
  return (await loadSectionResponse<T>(section, branchId, locale, signal)).data
}

export function rememberWatermark(branchId: string, value: StorefrontWatermark) { watermarks.set(branchId, value) }
export function previousWatermark(branchId: string) { return watermarks.get(branchId) }
export async function loadManifest(branchId: string) {
  return publicGet<StorefrontWatermark & { advertising: AdvertisingConfig | null }>(
    '/client/storefront/v1/manifest', { branch_id: branchId },
  )
}

export function rememberMenuValidity(branchId: string, locale: string, validUntil: string) {
  const until = Date.parse(validUntil)
  menuValidity.set(`${branchId}:${locale}`, Number.isFinite(until) ? until : 0)
}

export function invalidateMenuValidity(branchId: string, locale: string) {
  menuValidity.delete(`${branchId}:${locale}`)
}

export function renewMenuValidity(branchId: string, locale: string, validUntil: string) {
  if (!menuValidity.has(`${branchId}:${locale}`)) return
  const sectionUntil = sectionCache.get(`menu:${branchId}:${locale}`)?.validUntil
  const until = Math.min(Date.parse(validUntil), sectionUntil ? Date.parse(sectionUntil) : Infinity)
  if (Number.isFinite(until)) rememberMenuValidity(branchId, locale, new Date(until).toISOString())
}

export function publicMenuFresh(branchId: string, locale: string) {
  return (menuValidity.get(`${branchId}:${locale}`) ?? 0) > Date.now()
}

export function seedAdvertisingConfig(branchId: string, config: AdvertisingConfig | null, validUntil: string) {
  const until = Math.min(Date.parse(validUntil), Date.now() + 20_000)
  advertisingSeed = config && Number.isFinite(until) ? { branchId, until, config } : null
}

export function takeAdvertisingConfig(branchId: string): { config: AdvertisingConfig; until: number } | null {
  const seed = advertisingSeed
  advertisingSeed = null
  return seed?.branchId === branchId && seed.until > Date.now() ? { config: seed.config, until: seed.until } : null
}

export function loadStorefront(slug?: string, preferredBranchId?: string): Promise<Storefront> {
  const locale = currentLocale()
  const key = `${locale}:${slug ?? ''}:${preferredBranchId ?? ''}`
  const current = publicPending.get(key)
  if (current) return current.promise
  for (const [otherKey, pending] of publicPending) {
    if (otherKey !== key) { pending.controller.abort(); publicPending.delete(otherKey) }
  }
  const controller = new AbortController()
  const promise = publicGet<Storefront>('/client/storefront/v1/bootstrap', {
    ...(slug ? { slug } : preferredBranchId ? { branch_id: preferredBranchId } : {}), locale,
  }, controller.signal).then(data => {
    if (data.schema_version !== 1 || data.locale !== locale) throw new Error('Unsupported storefront response')
    return data
  }).finally(() => { if (publicPending.get(key)?.promise === promise) publicPending.delete(key) })
  publicPending.set(key, { controller, promise })
  return promise
}

export function loadPrivateSession(branchId: string, epoch: number) {
  if (privatePending?.branchId === branchId && privatePending.epoch === epoch) return privatePending.promise
  const promise = import('./client').then(({ api }) => api.get<PrivateSession>('/client/session/bootstrap', {
    params: { branch_id: branchId },
  })).then(({ data }) => {
    if (privatePending?.promise !== promise) throw new Error('Stale private session')
    return data
  }).finally(() => { if (privatePending?.promise === promise) privatePending = null })
  privatePending = { branchId, epoch, promise }
  return promise
}

export function pendingPrivateSession(branchId: string, epoch: number) {
  return privatePending?.branchId === branchId && privatePending.epoch === epoch
    ? privatePending.promise : null
}

export function pendingPrivateSessionForEpoch(epoch: number) {
  return privatePending?.epoch === epoch ? privatePending.promise : null
}
