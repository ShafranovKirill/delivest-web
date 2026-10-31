<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import type { Order } from '../../api/order.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useStarsLabel } from '@/modules/account/composables/useStarsLabel'

const props = defineProps<{ order: Order | null }>()

const { t } = useI18n()
const authStore = useAuthStore()
const branchStore = useBranchStore()
const starsLabel = useStarsLabel()

const earned = computed(() => {
  const rate = branchStore.activeBranch?.branch_info?.loyalty
  if (!props.order || !authStore.isAuthenticated || !rate?.enabled) return 0
  return props.order.points_earned ?? 0
})
</script>

<template>
  <div
    class="flex flex-col items-center gap-4 rounded-4xl bg-primary-soft px-6 py-8 text-center sm:py-10"
  >
    <span class="relative grid size-20 place-items-center">
      <span
        class="absolute inset-0 animate-ping rounded-full bg-primary/30 [animation-iteration-count:2]"
      />
      <span
        class="relative grid size-20 place-items-center rounded-full bg-primary-fill text-white shadow-lg"
      >
        <i class="pi pi-check text-3xl" />
      </span>
    </span>

    <div class="flex flex-col items-center gap-2">
      <h2 class="text-2xl font-extrabold text-gray-950 sm:text-3xl">
        {{ t('order.success.title') }}
      </h2>
      <span
        v-if="order?.short_number"
        class="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-gray-900 shadow-xs"
      >
        {{ t('order.number', { number: order.short_number }) }}
      </span>
      <span
        v-if="earned > 0"
        class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-700"
      >
        <i class="pi pi-star-fill" />
        +{{ t('loyalty.afterCompleted', { stars: starsLabel(earned) }) }}
      </span>
    </div>
  </div>
</template>
