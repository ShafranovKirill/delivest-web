const PUBLIC_TARGET = /^\/[a-zA-Z0-9_-]+(?:\/(?:product|category)\/[a-zA-Z0-9_-]+)?$/
const PARAMS = new Set(['product', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid', 'campaign_id', 'ad_id'])

export function publicLandingTarget(value: unknown, branchSlug?: string): string | null {
  if (typeof value !== 'string' || value.length > 4096 || !value.startsWith('/') || value.startsWith('//')) return null
  try {
    const url = new URL(value, 'https://delivest.invalid')
    if (url.origin !== 'https://delivest.invalid' || !PUBLIC_TARGET.test(url.pathname)) return null
    if (branchSlug && url.pathname.split('/')[1] !== branchSlug) return null
    for (const key of [...url.searchParams.keys()]) if (!PARAMS.has(key)) url.searchParams.delete(key)
    return url.pathname + url.search
  } catch { return null }
}
