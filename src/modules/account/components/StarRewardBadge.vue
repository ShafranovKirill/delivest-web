<script setup lang="ts">
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useStarsLabel } from '../composables/useStarsLabel'
import { useI18n } from 'vue-i18n'
withDefaults(defineProps<{ amount?: number | null; quantity?: number; compact?: boolean }>(), {
  quantity: 1,
  compact: false,
})
const branch = useBranchStore()
const label = useStarsLabel()
const { t } = useI18n()
</script>
<template>
  <span
    v-if="amount && amount > 0 && branch.activeBranch?.branch_info?.loyalty?.enabled"
    class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
    :class="{ 'h-8': compact }"
    :title="t('loyalty.itemBonus', { stars: label(amount * quantity) })"
    :aria-label="t('loyalty.itemBonus', { stars: label(amount * quantity) })"
  >
    <template v-if="compact">
      <span>+{{ amount * quantity }}</span>
      <i class="pi pi-star-fill text-[10px]" aria-hidden="true" />
    </template>
    <template v-else>
      <i class="pi pi-star-fill text-[10px]" aria-hidden="true" />
      {{ t('loyalty.itemBonus', { stars: label(amount * quantity) }) }}
    </template>
  </span>
</template>
