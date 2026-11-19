type Rollout = 'BOOTSTRAP' | 'UPDATES' | 'FUNNEL_BATCHING'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function raw(key: string): string | undefined {
  const runtime = typeof window === 'undefined' ? undefined : window._env?.[key]
  if (runtime !== undefined && runtime !== '') return runtime
  const built = import.meta.env[key] as string | undefined
  return built === '' ? undefined : built
}

function enabled(name: Rollout): boolean {
  const value = raw(`VITE_${name === 'BOOTSTRAP' ? 'STOREFRONT_BOOTSTRAP' : name === 'UPDATES' ? 'STOREFRONT_UPDATES' : 'FUNNEL_BATCHING'}`)
  if (value === undefined) return name === 'UPDATES' ? enabled('BOOTSTRAP') : true
  return value === 'true'
}

function allowed(name: Rollout, branchId?: string | null): boolean {
  if (!enabled(name)) return false
  const key = `VITE_${name === 'BOOTSTRAP' ? 'STOREFRONT_BOOTSTRAP' : name === 'UPDATES' ? 'STOREFRONT_UPDATES' : 'FUNNEL_BATCHING'}_BRANCH_IDS`
  const value = raw(key)
  if (value === undefined) return true
  const ids = value.split(',').map(id => id.trim())
  if (ids.some(id => !uuid.test(id))) return false
  return Boolean(branchId && ids.some(id => id.toLowerCase() === branchId.toLowerCase()))
}

export const storefrontReadsEnabled = (branchId?: string | null) => allowed('BOOTSTRAP', branchId)
export const storefrontUpdatesEnabled = (branchId?: string | null) => allowed('UPDATES', branchId)
export const funnelBatchingEnabled = (branchId?: string | null) => allowed('FUNNEL_BATCHING', branchId)
