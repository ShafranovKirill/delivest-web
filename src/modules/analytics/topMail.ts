export type TopMailConfig = { enabled?: boolean; counter_id?: string | null }
export type TopMailHit = { id: string; type: 'pageView'; url: string; referrer: string }

const KEY = /^[a-zA-Z0-9_-]{1,128}$/
const COUNTER = /^(?=.*[1-9])[0-9]{1,20}$/
let sdkPromise: Promise<void> | null = null

export function loadTopMailSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise
  const target = window as typeof window & { _tmr?: { push: (hit: TopMailHit) => void } }
  target._tmr ??= [] as unknown as { push: (hit: TopMailHit) => void }
  const existing = document.getElementById('tmr-code')
  if (existing?.tagName === 'SCRIPT') {
    const script = existing as HTMLScriptElement
    if (script.dataset.topMailLoading === 'true') {
      sdkPromise = new Promise<void>((resolve, reject) => {
        script.addEventListener('load', () => resolve(), { once: true })
        script.addEventListener(
          'error',
          () => {
            sdkPromise = null
            reject(new Error('Top.Mail.Ru unavailable'))
          },
          { once: true },
        )
      })
      return sdkPromise
    }
    return Promise.resolve()
  }
  sdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.id = 'tmr-code'
    script.async = true
    script.dataset.topMailLoading = 'true'
    script.src = 'https://top-fwz1.mail.ru/js/code.js'
    script.onload = () => {
      delete script.dataset.topMailLoading
      resolve()
    }
    script.onerror = () => {
      script.remove()
      sdkPromise = null
      reject(new Error('Top.Mail.Ru unavailable'))
    }
    document.head.appendChild(script)
  })
  return sdkPromise
}

export function topMailReferrer(raw: string, origin: string, slug: string): string {
  if (!raw) return ''
  try {
    const url = new URL(raw)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    return url.origin === origin ? (topMailPublicUrl(raw, origin, slug) ?? '') : url.origin
  } catch {
    return ''
  }
}

export function topMailPublicUrl(href: string, origin: string, slug: string): string | null {
  try {
    if (!KEY.test(slug)) return null
    const url = new URL(href, origin)
    if (url.origin !== origin) return null
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts[0] !== slug) return null
    if (
      parts.length === 1 ||
      (parts.length === 3 && ['product', 'category'].includes(parts[1]!) && KEY.test(parts[2]!))
    ) {
      return `${origin}/${parts.join('/')}`
    }
  } catch {
    /* Invalid URLs are ignored. */
  }
  return null
}

type Options = {
  load: () => Promise<void>
  push: (hit: TopMailHit) => void
  location: () => { href: string; origin: string }
  referrer: () => string
}

export function createTopMailRuntime(options: Options) {
  let current: { branchId: string; slug: string; id: string } | null = null
  let epoch = 0
  let lastUrl: string | null = null

  function configure(
    branchId: string | undefined,
    slug: string | undefined,
    config: TopMailConfig | undefined,
  ) {
    const id = config?.counter_id
    const next =
      branchId && slug && config?.enabled && id && COUNTER.test(id) ? { branchId, slug, id } : null
    if (
      next?.branchId === current?.branchId &&
      next?.id === current?.id &&
      next?.slug === current?.slug
    )
      return
    epoch++
    current = next
    lastUrl = null
  }

  function page() {
    const selected = current
    if (!selected) return
    const location = options.location()
    const url = topMailPublicUrl(location.href, location.origin, selected.slug)
    if (!url) {
      lastUrl = null
      return
    }
    if (url === lastUrl) return
    const previous = lastUrl
    lastUrl = url
    const currentEpoch = epoch
    const referrer = previous ?? topMailReferrer(options.referrer(), location.origin, selected.slug)
    void options
      .load()
      .then(() => {
        if (epoch !== currentEpoch || current !== selected) return
        options.push({ id: selected.id, type: 'pageView', url, referrer })
      })
      .catch(() => {
        if (epoch === currentEpoch) lastUrl = null
      })
  }

  return {
    configure,
    page,
    reset: () => {
      epoch++
      current = null
      lastUrl = null
    },
  }
}
