import { defineStore } from 'pinia'
import { onScopeDispose, watch } from 'vue'
import axios from 'axios'
import { getApiBaseUrl } from '@/utils/env'
import { loadSectionResponse, takeAdvertisingConfig } from '@/api/storefront'
import { storefrontReadsEnabled, storefrontUpdatesEnabled } from '@/api/storefrontPolicy'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { commerceDelta, createMetrikaRuntime, loadMetrikaSdk, type AdvertisingConfig } from './metrika'
import type { CartItem } from '@/modules/cart/api/cart.service'
import { useMenuStore } from '@/modules/menu/stores/menu.store'

const advertisingApi = axios.create({ withCredentials: true, headers: { 'Content-Type': 'application/json' } })

export const useMetrikaAnalytics = defineStore('metrikaAnalytics', () => {
  const auth = useAuthStore()
  const branch = useBranchStore()
  const menu = useMenuStore()
  let request: AbortController | null = null
  let identityRequest: AbortController | null = null
  let identityPending: Promise<unknown> | null = null
  let timer: ReturnType<typeof setInterval> | undefined
  let stop: (() => void) | undefined
  let version = 0
  let liveUntil = 0
  let lastFallback = 0
  let currentConfig: AdvertisingConfig | null = null
  let bootstrapMode = false
  const permitted = () => liveUntil > Date.now()
  const expire = () => { if (liveUntil && !permitted()) { liveUntil = 0; runtime.reset() } }
  let viewedProduct: string | undefined
  const runtime = createMetrikaRuntime({
    load: loadMetrikaSdk,
    permitted,
    location: () => window.location,
    referrer: () => document.referrer,
    menuVisible: () => {
      const parts = window.location.pathname.split('/').filter(Boolean)
      const isMenu = parts.length === 1 ||
        (parts.length === 3 && ['product', 'category'].includes(parts[1]!))
      // Category sections exist only after real menu data has rendered; cached
      // data from another screen must not create a menu-view goal.
      return isMenu && document.querySelector('[id^="category-"]') !== null
    },
    ready: () => {
      if (menu.isProductModalOpen && menu.activeProduct) {
        track('product_view')
        runtime.detail(menu.activeProduct)
      }
    },
    layer: event => {
      if (typeof window === 'undefined') return
      const target = window as unknown as { delivestMetrikaLayer?: unknown[] }
      if (event === null) { if (target.delivestMetrikaLayer) target.delivestMetrikaLayer.length = 0; return }
      const layer = target.delivestMetrikaLayer ??= []
      layer.push(event)
      if (layer.length > 20) layer.splice(0, layer.length - 20)
    },
    identify: (identity, generation, featureVersion) => {
      if (!permitted()) return
      const branchId = branch.activeBranch?.id
      if (!branchId) return
      identityRequest?.abort()
      identityRequest = new AbortController()
      const pending = advertisingApi.post(`/client/branches/${branchId}/advertising/identity`, { generation, feature_version: featureVersion, ...identity }, {
        baseURL: getApiBaseUrl(),
        signal: identityRequest.signal,
        timeout: 1500,
        headers: auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : undefined,
      }).catch(() => { /* optional capture */ })
      identityPending = pending
      void pending.finally(() => { if (identityPending === pending) identityPending = null })
    },
  })

  function track(event: string) {
    expire()
    if (!permitted()) return
    if (event === 'product_view') {
      const product = menu.activeProduct?.id
      if (product !== viewedProduct) runtime.closeDetail()
      viewedProduct = product
    }
    runtime.track(event)
  }

  function closeDetail() {
    viewedProduct = undefined
    runtime.closeDetail()
  }

  async function refresh() {
    const branchId = branch.activeBranch?.id
    if (!branchId) return
    const seeded = takeAdvertisingConfig(branchId)
    if (seeded) { bootstrapMode = true; liveUntil = seeded.until; currentConfig = seeded.config; runtime.configure(seeded.config); return }
    const epoch = version
    request?.abort()
    const controller = new AbortController()
    request = controller
    try {
      const section = storefrontReadsEnabled(branchId)
        ? await loadSectionResponse<AdvertisingConfig>('advertising', branchId, undefined, controller.signal)
        : { data: (await advertisingApi.get<{ data: AdvertisingConfig }>(`/client/branches/${branchId}/advertising/config`, {
            baseURL: getApiBaseUrl(), signal: controller.signal, timeout: 3000,
          })).data.data, validUntil: new Date(Date.now() + 20_000).toISOString() }
      if (epoch === version && !controller.signal.aborted) {
        liveUntil = Math.min(Date.parse(section.validUntil), Date.now() + 20_000)
        currentConfig = section.data
        if (Number.isFinite(liveUntil) && liveUntil > Date.now()) runtime.configure(section.data)
        else { liveUntil = 0; runtime.reset() }
      }
    } catch {
      if (epoch === version && !controller.signal.aborted) { liveUntil = 0; currentConfig = null; runtime.reset() }
    }
  }

  function start() {
    if (stop || typeof window === 'undefined') return
    stop = watch(() => [branch.activeBranch?.id, auth.sessionEpoch, auth.client?.id] as const, () => {
      version++
      request?.abort()
      identityRequest?.abort()
      identityPending = null
      runtime.reset()
      liveUntil = 0
      currentConfig = null
      bootstrapMode = false
      lastFallback = Date.now()
      void refresh()
    }, { immediate: true, flush: 'sync' })
    timer = setInterval(() => {
      expire()
      if ((storefrontUpdatesEnabled(branch.activeBranch?.id) && bootstrapMode) || document.visibilityState === 'hidden' || liveUntil || Date.now() - lastFallback < 20_000) return
      lastFallback = Date.now()
      void refresh()
    }, 1000)
  }

  onScopeDispose(() => {
    version++
    clearInterval(timer)
    stop?.()
    request?.abort()
    identityRequest?.abort()
    runtime.reset()
  })
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    const checkVisibility = () => { if (document.visibilityState === 'visible') expire() }
    document.addEventListener('visibilitychange', checkVisibility)
    onScopeDispose(() => document.removeEventListener('visibilitychange', checkVisibility))
  }

  async function flushIdentity() {
    if (!identityPending) return
    let timeout: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([identityPending, new Promise(resolve => { timeout = setTimeout(resolve, 200) })])
    } finally { clearTimeout(timeout) }
  }

  return {
    start, flushIdentity, page: () => { expire(); if (permitted()) runtime.page() }, track,
    detail: (...args: Parameters<typeof runtime.detail>) => { expire(); if (permitted()) runtime.detail(...args) },
    closeDetail,
    confirmWatermark: (validUntil: string) => {
      const until = Date.parse(validUntil)
      if (!Number.isFinite(until) || until <= Date.now()) { liveUntil = 0; runtime.reset(); return }
      const wasExpired = !permitted()
      liveUntil = Math.min(until, Date.now() + 20_000)
      if (wasExpired && currentConfig) runtime.configure(currentConfig)
    },
    applyConfig: (config: AdvertisingConfig | null, validUntil: string) => {
      const until = Date.parse(validUntil)
      if (!config || !Number.isFinite(until) || until <= Date.now()) { liveUntil = 0; currentConfig = null; runtime.reset(); return }
      liveUntil = Math.min(until, Date.now() + 20_000)
      currentConfig = config
      bootstrapMode = true
      runtime.configure(config)
    },
    revalidate: refresh,
    disable: () => { liveUntil = 0; currentConfig = null; runtime.reset() },
    cartChange: (before: CartItem[], after: CartItem[]) => {
      expire()
      if (!permitted()) return
      for (const event of commerceDelta(before, after)) runtime.commerce(event.action, event.products)
    },
  }
})
