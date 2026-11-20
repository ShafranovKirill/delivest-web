import { defineStore } from 'pinia'
import { onScopeDispose, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { createTopMailRuntime, loadTopMailSdk, type TopMailHit } from './topMail'

export const useTopMailAnalytics = defineStore('topMailAnalytics', () => {
  const branch = useBranchStore()
  const route = useRoute()
  const runtime = createTopMailRuntime({
    load: loadTopMailSdk,
    push: (hit: TopMailHit) => {
      const target = window as typeof window & { _tmr?: { push: (hit: TopMailHit) => void } }
      if (!target._tmr) target._tmr = [] as unknown as { push: (hit: TopMailHit) => void }
      target._tmr.push(hit)
    },
    location: () => window.location,
    referrer: () => document.referrer,
  })

  const stop = watch(
    () =>
      [
        branch.activeBranch?.id,
        branch.activeBranch?.slug,
        branch.activeBranch?.branch_info?.vk_ads?.enabled,
        branch.activeBranch?.branch_info?.vk_ads?.counter_id,
        route.fullPath,
      ] as const,
    () => {
      const selected = branch.activeBranch
      runtime.configure(selected?.id, selected?.slug, selected?.branch_info?.vk_ads)
      runtime.page()
    },
    { immediate: true, flush: 'sync' },
  )

  onScopeDispose(() => {
    stop()
    runtime.reset()
  })

  return { reset: runtime.reset }
})
