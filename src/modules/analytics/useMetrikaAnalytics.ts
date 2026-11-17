import { defineStore } from 'pinia'
import { onScopeDispose, watch } from 'vue'
import axios from 'axios'
import { getApiBaseUrl } from '@/utils/env'
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
  const runtime = createMetrikaRuntime({
    load: loadMetrikaSdk,
    location: () => window.location,
    referrer: () => document.referrer,
    ready: () => {
      if (menu.isProductModalOpen && menu.activeProduct) runtime.detail(menu.activeProduct)
    },
    layer: event => {
      if (typeof window === 'undefined') return
      const target = window as unknown as { delivestMetrikaLayer?: unknown[] }
      if (event === null) { if (target.delivestMetrikaLayer) target.delivestMetrikaLayer.length = 0; return }
      const layer = target.delivestMetrikaLayer ??= []
      layer.push(event)
      if (layer.length > 20) layer.splice(0, layer.length - 20)
    },
    identify: (identity, generation) => {
      const branchId = branch.activeBranch?.id
      if (!branchId) return
      identityRequest?.abort()
      identityRequest = new AbortController()
      const pending = advertisingApi.post(`/client/branches/${branchId}/advertising/identity`, { generation, ...identity }, {
        baseURL: getApiBaseUrl(),
        signal: identityRequest.signal,
        timeout: 1500,
        headers: auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : undefined,
      }).catch(() => { /* optional capture */ })
      identityPending = pending
      void pending.finally(() => { if (identityPending === pending) identityPending = null })
    },
  })

  async function refresh() {
    const branchId = branch.activeBranch?.id
    if (!branchId) return
    const epoch = version
    request?.abort()
    const controller = new AbortController()
    request = controller
    try {
      const response = await advertisingApi.get<{ data: AdvertisingConfig }>(`/client/branches/${branchId}/advertising/config`, {
        baseURL: getApiBaseUrl(), signal: controller.signal, timeout: 3000,
      })
      if (epoch === version && !controller.signal.aborted) runtime.configure(response.data.data)
    } catch {
      if (epoch === version && !controller.signal.aborted) runtime.reset()
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
      void refresh()
    }, { immediate: true, flush: 'sync' })
    timer = setInterval(() => { void refresh() }, 20_000)
  }

  onScopeDispose(() => {
    version++
    clearInterval(timer)
    stop?.()
    request?.abort()
    identityRequest?.abort()
    runtime.reset()
  })

  async function flushIdentity() {
    if (!identityPending) return
    let timeout: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([identityPending, new Promise(resolve => { timeout = setTimeout(resolve, 200) })])
    } finally { clearTimeout(timeout) }
  }

  return {
    start, flushIdentity, page: runtime.page, track: runtime.track, detail: runtime.detail, closeDetail: runtime.closeDetail,
    cartChange: (before: CartItem[], after: CartItem[]) => {
      for (const event of commerceDelta(before, after)) runtime.commerce(event.action, event.products)
    },
  }
})
