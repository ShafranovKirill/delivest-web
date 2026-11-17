export type AdvertisingConfig = {
  enabled: boolean
  counter_id: string | null
  generation: number
  feature_version: string
  ecommerce: boolean
  capture: boolean
  collection_basis: 'admin_approved' | 'disabled'
}

export type Ym = (counter: string, method: string, ...args: unknown[]) => void
type QueuedYm = Ym & { a?: unknown[]; l?: number }
export type AdvertisingIdentity = Partial<Record<'client_id' | 'yclid' | 'campaign_id' | 'ad_id', string>>
export type CommerceProduct = { id: string; price: string; quantity: number }

const DISABLED: AdvertisingConfig = {
  enabled: false, counter_id: null, generation: 0, feature_version: '', ecommerce: false, capture: false,
  collection_basis: 'disabled',
}
const KEY = /^[a-zA-Z0-9_-]{1,128}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function safeConfig(value: AdvertisingConfig): AdvertisingConfig {
  if (!value || typeof value !== 'object' ||
      !['enabled', 'capture', 'ecommerce'].every(key => typeof value[key as 'enabled'] === 'boolean') ||
      typeof value.feature_version !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value.feature_version) ||
      !Number.isSafeInteger(value.generation) || value.generation < 0 ||
      !['admin_approved', 'disabled'].includes(value.collection_basis) ||
      !(value.counter_id === null || (typeof value.counter_id === 'string' && /^\d{1,20}$/.test(value.counter_id))) ||
      (value.enabled && (!value.counter_id || !value.capture)) ||
      (value.capture && value.collection_basis !== 'admin_approved')) return DISABLED
  return { enabled: value.enabled, counter_id: value.counter_id, generation: value.generation, feature_version: value.feature_version,
    ecommerce: value.ecommerce, capture: value.capture, collection_basis: value.collection_basis }
}

// External analytics never receives checkout/account routes, query strings or hashes.
export function publicAnalyticsUrl(url: string, origin: string): string | null {
  try {
    const parsed = new URL(url, origin)
    if (parsed.origin !== origin) return null
    const parts = parsed.pathname.split('/').filter(Boolean)
    const branch = parts[0]
    if (!branch || !KEY.test(branch) || branch === 'select-branch') return null
    const path = parts.length === 1 ||
      (parts.length === 3 && ['product', 'category'].includes(parts[1]!) && KEY.test(parts[2]!))
      ? parsed.pathname : `/${branch}`
    return `${origin}${path}`
  } catch { return null }
}

export function advertisingIdentity(search: string): AdvertisingIdentity {
  const params = new URLSearchParams(search)
  const identity: AdvertisingIdentity = {}
  for (const key of ['yclid', 'campaign_id', 'ad_id'] as const) {
    const value = params.get(key)
    if (value && /^\d{1,32}$/.test(value)) identity[key] = value
  }
  return identity
}

export function minorToRub(minor: number): string {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error('Invalid minor amount')
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, '0')}`
}

type CartLine = { key: string; product_id: string; quantity: number; total_price: number; gift?: boolean; stars?: boolean }
export function commerceDelta(before: CartLine[], after: CartLine[]) {
  const events: { action: 'add' | 'remove'; products: CommerceProduct[] }[] = []
  const previous = new Map(before.map(item => [item.key, item]))
  const current = new Map(after.map(item => [item.key, item]))
  for (const key of new Set([...previous.keys(), ...current.keys()])) {
    const old = previous.get(key)
    const next = current.get(key)
    const delta = (next?.quantity ?? 0) - (old?.quantity ?? 0)
    const line = delta > 0 ? next : old
    if (!delta || !line || line.gift || line.stars || !UUID.test(line.product_id) || !line.quantity) continue
    const unit = Math.round(line.total_price / line.quantity)
    if (!Number.isSafeInteger(unit) || unit < 0) continue
    events.push({ action: delta > 0 ? 'add' : 'remove', products: [{
      id: line.product_id, price: minorToRub(unit), quantity: Math.abs(delta),
    }] })
  }
  return events
}

type RuntimeOptions = {
  load: () => Promise<Ym>
  location: () => { href: string; origin: string; search: string }
  referrer: () => string
  layer: (event: unknown | null) => void
  identify: (identity: AdvertisingIdentity, generation: number, featureVersion: string) => void
  menuVisible?: () => boolean
  ready?: () => void
}

export function createMetrikaRuntime(options: RuntimeOptions) {
  let config = DISABLED
  let epoch = 0
  let ym: Ym | null = null
  let queue: (() => void)[] = []
  let lastPage: string | null = null
  let lastDetail: string | null = null
  let failed = false
  let attempts = 0
  let productTracked = false
  let visitTracked = false
  let menuTracked = false

  function reset() {
    epoch++
    if (ym && config.counter_id) {
      try { ym(config.counter_id, 'destruct') } catch { /* optional SDK */ }
    }
    ym = null
    queue = []
    lastPage = null
    lastDetail = null
    failed = false
    attempts = 0
    productTracked = false
    visitTracked = false
    menuTracked = false
    config = DISABLED
    options.layer(null)
  }

  const enabled = () => config.enabled && config.collection_basis === 'admin_approved' &&
    !!config.counter_id && /^\d{1,20}$/.test(config.counter_id)

  function send(action: () => void) {
    if (!enabled() || failed) return false
    if (ym) {
      try { action() } catch { /* must not affect checkout */ }
      return true
    }
    if (queue.length < 20) { queue.push(action); return true }
    return false
  }

  function page() {
    if (!enabled()) return
    const location = options.location()
    const url = publicAnalyticsUrl(location.href, location.origin)
    if (!url || url === lastPage) return
    lastPage = url
    const referer = publicAnalyticsUrl(options.referrer(), location.origin) ?? ''
    send(() => ym?.(config.counter_id!, 'hit', url, { referer, title: 'Меню' }))
  }

  function configure(next: AdvertisingConfig) {
    next = safeConfig(next)
    const unchanged = JSON.stringify(config) === JSON.stringify(next)
    // Polling may recover a transient provider failure, with a strict budget
    // per configuration. Reset fences old callbacks and drops stale actions.
    if (unchanged && (!failed || attempts >= 3)) return
    const previousAttempts = unchanged ? attempts : 0
    reset()
    attempts = previousAttempts
    config = next
    if (config.capture && config.collection_basis === 'admin_approved') {
      const identity = advertisingIdentity(options.location().search)
      if (Object.keys(identity).length) options.identify(identity, config.generation, config.feature_version)
    }
    if (!enabled()) return
    const version = epoch
    attempts++
    void options.load().then(client => {
      if (version !== epoch || !enabled()) return
      ym = client
      const location = options.location()
      const url = publicAnalyticsUrl(location.href, location.origin)
      if (!url) { reset(); return }
      try {
        ym(config.counter_id!, 'init', {
          defer: true, webvisor: false, clickmap: false, trackLinks: false,
          trackHash: false, accurateTrackBounce: false, sendTitle: false,
          url, referrer: publicAnalyticsUrl(options.referrer(), location.origin) ?? '',
          ecommerce: config.ecommerce ? 'delivestMetrikaLayer' : false,
        })
        const pending = queue
        queue = []
        for (const action of pending) action()
        page()
        // These describe the current screen after collection is approved; no
        // actions from the disabled or unknown-config period are retained.
        track('visit')
        if (options.menuVisible?.()) track('menu_view')
        options.ready?.()
        if (config.capture) {
          const identity = advertisingIdentity(location.search)
          ym(config.counter_id!, 'getClientID', (clientId: string) => {
            if (version !== epoch || !enabled() || !config.capture) return
            if (typeof clientId === 'string' && /^\d{1,32}$/.test(clientId)) identity.client_id = clientId
            if (Object.keys(identity).length) options.identify(identity, config.generation, config.feature_version)
          })
        }
      } catch { failed = true; queue = [] }
    }).catch(() => { if (version === epoch) { failed = true; queue = [] } })
  }

  function track(event: string) {
    if (!['visit', 'menu_view', 'product_view', 'cart_add', 'checkout_start', 'fulfillment_selected'].includes(event)) return
    if ((event === 'visit' && visitTracked) || (event === 'menu_view' && menuTracked) ||
        (event === 'product_view' && productTracked)) return
    if (send(() => ym?.(config.counter_id!, 'reachGoal', `delivest_${event}`))) {
      if (event === 'visit') visitTracked = true
      if (event === 'menu_view') menuTracked = true
      if (event === 'product_view') productTracked = true
    }
  }

  function commerce(action: 'detail' | 'add' | 'remove', products: CommerceProduct[]) {
    if (!enabled() || !config.ecommerce || !products.length) return
    const valid = products.filter(product => UUID.test(product.id) && product.quantity > 0 && /^\d+\.\d{2}$/.test(product.price))
    if (!valid.length) return
    send(() => options.layer({ ecommerce: { currencyCode: 'RUB', [action]: { products: valid } } }))
  }

  function detail(product: { id?: string; price?: number }) {
    if (!enabled() || !product.id || !UUID.test(product.id) || product.id === lastDetail) return
    if (!Number.isSafeInteger(product.price) || product.price! < 0) return
    lastDetail = product.id
    commerce('detail', [{ id: product.id, price: minorToRub(product.price!), quantity: 1 }])
  }

  return { configure, reset, page, track, detail, closeDetail: () => { lastDetail = null; productTracked = false }, commerce }
}

let sdkPromise: Promise<Ym> | null = null
export function loadMetrikaSdk(): Promise<Ym> {
  const target = window as unknown as { ym?: QueuedYm }
  if (sdkPromise) return sdkPromise
  if (target.ym) return Promise.resolve(target.ym)
  const stub: QueuedYm = (...args: unknown[]) => { (stub.a ??= []).push(args) }
  stub.l = Date.now()
  target.ym = stub
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.async = true
    script.referrerPolicy = 'no-referrer'
    script.src = 'https://mc.yandex.ru/metrika/tag.js'
    const fail = () => {
      script.remove()
      if (target.ym === stub) delete target.ym
      sdkPromise = null
      reject(new Error('Analytics unavailable'))
    }
    const timer = setTimeout(fail, 5000)
    script.onload = () => {
      clearTimeout(timer)
      if (target.ym) resolve(target.ym)
      else fail()
    }
    script.onerror = () => { clearTimeout(timer); fail() }
    document.head.appendChild(script)
  })
  return sdkPromise
}
