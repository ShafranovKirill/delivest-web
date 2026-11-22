import { onScopeDispose, watch } from 'vue'
import type { Channel } from 'phoenix'
import { getSocket } from '@/api/socket'
import { invalidateMenuValidity, loadManifest, previousWatermark, rememberWatermark, renewMenuValidity, type StorefrontWatermark } from '@/api/storefront'
import { queryClient } from '@/api/client'
import { currentLocale } from '@/i18n'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '../stores/branch.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { FranchiseService } from '@/modules/franchise/api/franchise.service'
import { BranchService } from '../api/branch.service'
import { useMetrikaAnalytics } from '@/modules/analytics/useMetrikaAnalytics'

export function useStorefrontUpdates() {
  const branch = useBranchStore()
  const auth = useAuthStore()
  const metrika = useMetrikaAnalytics()
  const franchise = useFranchiseStore()
  let channel: Channel | null = null
  let generation = 0
  let lastWatermark = Date.now()
  let manifestPending = false
  let settingsPending = false
  let appliedFranchiseRevision: string | number | undefined
  let appliedBranchesRevision: string | number | undefined

  function apply(branchId: string, watermark: StorefrontWatermark) {
    if (branch.activeBranch?.id !== branchId) return
    const until = Date.parse(watermark.valid_until)
    if (!Number.isFinite(until) || until <= Date.now()) { metrika.disable(); return }
    const previous = previousWatermark(branchId)
    rememberWatermark(branchId, watermark)
    lastWatermark = Date.now()
    const changed = (name: string) => previous?.revisions[name] !== watermark.revisions[name]
    if (changed('advertising')) {
      if (watermark.advertising !== undefined) metrika.applyConfig(watermark.advertising, watermark.valid_until)
      else { metrika.disable(); void metrika.revalidate() }
    }
    else metrika.confirmWatermark(watermark.valid_until)
    if (changed('menu')) {
      invalidateMenuValidity(branchId, currentLocale())
      void queryClient.invalidateQueries({ queryKey: ['menu', branchId, currentLocale()] })
    } else if (queryClient.getQueryData(['menu', branchId, currentLocale()])) {
      renewMenuValidity(branchId, currentLocale(), watermark.valid_until)
    }
    if (changed('stories')) void queryClient.invalidateQueries({ queryKey: ['stocks', branchId] })
    if (!settingsPending &&
      (appliedFranchiseRevision !== watermark.revisions.franchise ||
        appliedBranchesRevision !== watermark.revisions.branches)) {
      settingsPending = true
      const current = generation
      void (async () => {
        try {
          const [nextFranchise, nextBranches] = await Promise.all([
            appliedFranchiseRevision !== watermark.revisions.franchise
              ? FranchiseService.getFranchise()
              : Promise.resolve(null),
            BranchService.getBranches(),
          ])
          if (current !== generation) return
          if (nextFranchise) franchise.setFranchise(nextFranchise)
          branch.setBranches(nextBranches)
          appliedFranchiseRevision = watermark.revisions.franchise
          appliedBranchesRevision = watermark.revisions.branches
        } catch { /* The next watermark retries the same revision. */ }
        finally { settingsPending = false }
      })()
    }
  }

  function disconnect() { channel?.leave(); channel = null }

  async function connect(branchId: string, epoch: number, current: number) {
    try {
      const socket = await getSocket(epoch, () => auth.sessionEpoch === epoch)
      if (generation !== current || branch.activeBranch?.id !== branchId) return
      const next = socket.channel(`storefront:${branchId}`)
      channel = next
      next.on('watermark', (value: StorefrontWatermark) => apply(branchId, value))
      next.on('revision', (value: StorefrontWatermark) => apply(branchId, value))
      next.join().receive('error', () => { if (channel === next) disconnect() })
    } catch { /* Manifest fallback handles an unavailable socket. */ }
  }

  watch([() => branch.activeBranch?.id, () => auth.sessionEpoch], ([branchId, epoch]) => {
    generation++
    disconnect()
    lastWatermark = Date.now()
    appliedFranchiseRevision = branchId ? previousWatermark(branchId)?.revisions.franchise : undefined
    appliedBranchesRevision = branchId ? previousWatermark(branchId)?.revisions.branches : undefined
    if (branchId) void connect(branchId, epoch, generation)
  }, { immediate: true })

  async function refreshManifest() {
    const branchId = branch.activeBranch?.id
    if (!branchId || document.visibilityState === 'hidden' ||
      Date.now() - lastWatermark < 20_000 || manifestPending) return
    const current = generation
    manifestPending = true
    try {
      const manifest = await loadManifest(branchId)
      if (current === generation) apply(branchId, manifest)
    } catch { metrika.disable() }
    finally { manifestPending = false }
  }
  const timer = setInterval(() => { void refreshManifest() }, 5000)
  const visible = () => { if (document.visibilityState === 'visible') void refreshManifest() }
  document.addEventListener('visibilitychange', visible)
  onScopeDispose(() => { generation++; disconnect(); clearInterval(timer); document.removeEventListener('visibilitychange', visible) })
}
