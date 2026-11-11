export type SourceLabels = {
  source_type: 'direct' | 'campaign' | 'unknown'
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

const LABEL = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const

export function sourceLabels(search: string, hasReferrer: boolean): SourceLabels {
  const params = new URLSearchParams(search)
  const labels: Partial<Record<(typeof UTM_KEYS)[number], string>> = {}
  let hasUtm = false
  for (const key of UTM_KEYS) {
    const raw = params.get(key)
    if (raw === null) continue
    hasUtm = true
    if (raw.length <= 64 && LABEL.test(raw) && raw.replace(/[-_]/g, '').replace(/\D/g, '').length < 7) {
      labels[key] = raw
    }
  }
  if (Object.keys(labels).length) return { source_type: 'campaign', ...labels }
  return { source_type: hasReferrer || hasUtm ? 'unknown' : 'direct' }
}
