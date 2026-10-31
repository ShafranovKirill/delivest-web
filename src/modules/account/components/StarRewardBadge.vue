<script setup lang="ts">
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useStarsLabel } from '../composables/useStarsLabel'
import { useI18n } from 'vue-i18n'
withDefaults(defineProps<{ amount?: number | null; quantity?: number }>(), { quantity: 1 })
const branch = useBranchStore()
const label = useStarsLabel()
const { t } = useI18n()
</script>
<template>
  <span
    v-if="amount && amount > 0 && branch.activeBranch?.branch_info?.loyalty?.enabled"
    class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
  >
    <i class="pi pi-star-fill text-[10px]" aria-hidden="true" />
    {{ t('loyalty.itemBonus', { stars: label(amount * quantity) }) }}
  </span>
</template>
