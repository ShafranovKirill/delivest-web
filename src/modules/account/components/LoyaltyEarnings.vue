<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/modules/cart/stores/cart.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { starsFor } from '../utils/stars'
import { useStarsLabel } from '../composables/useStarsLabel'
const props = withDefaults(defineProps<{ spendPoints?: number; plain?: boolean }>(), { spendPoints: 0 })
const cart = useCartStore()
const branch = useBranchStore()
const { t } = useI18n()
const label = useStarsLabel()
const base = computed(() =>
  props.spendPoints
    ? starsFor(
        cart.totalAmount - props.spendPoints * 100,
        0,
        branch.activeBranch?.branch_info?.loyalty,
      )
    : cart.baseStars,
)
const total = computed(() => base.value + cart.productStars)
</script>
<template>
  <p v-if="plain && total > 0 && branch.activeBranch?.branch_info?.loyalty?.enabled" class="flex items-center justify-between gap-3 text-sm">
    <span class="text-gray-500">{{ t('loyalty.earnForOrder') }}</span>
    <span class="inline-flex items-center gap-1.5 whitespace-nowrap font-medium tabular-nums text-primary">
      <i class="pi pi-star-fill" aria-hidden="true" />+{{ label(total) }}
    </span>
  </p>
  <div
    v-else-if="!plain && total > 0 && branch.activeBranch?.branch_info?.loyalty?.enabled"
    class="space-y-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800"
  >
    <div v-if="cart.productStars > 0" class="space-y-1 text-xs text-amber-700">
      <div class="flex justify-between gap-3">
        <span>{{ t('loyalty.fromAmount') }}</span
        ><span>+{{ label(base) }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span>{{ t('loyalty.fromProducts') }}</span
        ><span>+{{ label(cart.productStars) }}</span>
      </div>
    </div>
    <div class="flex items-center justify-between gap-3 font-semibold">
      <span>{{ t('loyalty.earnTotal') }}</span>
      <span class="inline-flex items-center gap-1.5 whitespace-nowrap"
        ><i class="pi pi-star-fill" aria-hidden="true" />+{{ label(total) }}</span
      >
    </div>
  </div>
</template>
