<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useActiveOrdersQuery } from '@/modules/order/composables/useActiveOrdersQuery'
import { useBranchStore } from '../stores/branch.store'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import BrandLogo from '@/modules/franchise/components/BrandLogo.vue'

const { t } = useI18n()
const branch = useBranchStore()
const franchise = useFranchiseStore()
const activeOrders = useActiveOrdersQuery()
const orderLink = computed(() => {
  const order = activeOrders.data.value?.find((item) =>
    branch.branches.some((candidate) => candidate.id === item.branch_id),
  )
  const slug = branch.branches.find((candidate) => candidate.id === order?.branch_id)?.slug
  return slug && order ? `/${slug}/checkout/order/${order.id}` : null
})
const branchOnly = computed(() => !franchise.franchise?.maintenance_enabled)
</script>

<template>
  <main id="storefront-maintenance" class="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-5 py-10 text-gray-950">
    <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_16%,color-mix(in_srgb,var(--p-primary-color)_12%,transparent),transparent_38%),radial-gradient(circle_at_84%_82%,color-mix(in_srgb,var(--p-primary-color)_9%,transparent),transparent_42%)]" />
    <div class="relative w-full max-w-2xl text-center">
      <BrandLogo class="mx-auto mb-10 max-w-48 text-3xl" />
      <div class="mx-auto mb-8 w-full max-w-md text-primary" aria-hidden="true">
        <svg viewBox="0 0 420 250" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
          <circle cx="210" cy="125" r="113" fill="currentColor" opacity=".08" />
          <circle cx="210" cy="125" r="92" stroke="currentColor" opacity=".24" stroke-width="2" stroke-dasharray="6 11" />
          <path d="M99 188c20-23 49-34 86-34h50c36 0 65 11 86 34" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".28" />
          <rect x="130" y="93" width="160" height="99" rx="16" fill="currentColor" opacity=".16" />
          <rect x="130" y="93" width="160" height="99" rx="16" stroke="currentColor" stroke-width="3" />
          <path d="M143 93 158 61h104l15 32" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
          <path d="M162 93v26a16 16 0 0 0 32 0V93m0 0v26a16 16 0 0 0 32 0V93m0 0v26a16 16 0 0 0 32 0V93" stroke="currentColor" stroke-width="3" />
          <path d="M166 192v-42c0-4 3-7 7-7h29c4 0 7 3 7 7v42m28-37h28v22h-28z" stroke="currentColor" stroke-width="3" />
          <circle cx="306" cy="59" r="30" fill="currentColor" />
          <path d="m295 59 7 7 15-16" stroke="var(--p-primary-contrast-color, #fff)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="m95 83 9 9m12-40 3 12m202 65 12-3m-6-65-9 9" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".65" />
        </svg>
      </div>
      <p class="mb-3 text-xs font-bold uppercase tracking-[.25em] text-primary">{{ t('maintenance.kicker') }}</p>
      <h1 class="text-3xl font-bold tracking-tight sm:text-5xl">{{ t('maintenance.title') }}</h1>
      <p class="mx-auto mt-5 max-w-xl text-base leading-relaxed opacity-75 sm:text-lg">{{ t('maintenance.description') }}</p>
      <div class="mt-9 flex flex-wrap items-center justify-center gap-3">
        <RouterLink v-if="orderLink" :to="orderLink" class="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-[color:var(--p-primary-contrast-color,#fff)] transition hover:opacity-90">{{ t('maintenance.activeOrder') }}</RouterLink>
        <RouterLink v-if="branchOnly && branch.activeBranch" :to="{ name: 'select-branch', query: { return_to: `/${branch.activeBranch.slug}` } }" class="rounded-full border px-6 py-3 text-sm font-semibold transition hover:opacity-75" style="color: var(--color-gray-950); border-color: currentColor">{{ t('maintenance.otherBranch') }}</RouterLink>
      </div>
    </div>
  </main>
</template>
