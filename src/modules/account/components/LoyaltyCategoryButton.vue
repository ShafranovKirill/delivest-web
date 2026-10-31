<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLoyaltyQuery } from '../composables/useLoyaltyQuery'
import { useLoyaltyModalStore } from '../stores/loyalty.store'
const branch = useBranchStore()
const auth = useAuthStore()
const modal = useLoyaltyModalStore()
const loyalty = useLoyaltyQuery()
const { t } = useI18n()
</script>
<template>
  <button
    v-if="branch.activeBranch?.branch_info?.loyalty?.enabled"
    id="loyalty-category-button"
    type="button"
    class="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    :aria-label="t('loyalty.title')"
    aria-haspopup="dialog"
    :aria-expanded="modal.isOpen"
    @click="modal.open"
  >
    <span
      class="grid size-11 shrink-0 place-items-center rounded-full bg-primary-fill text-white transition-transform hover:scale-105 active:scale-95"
    >
      <i class="pi pi-star-fill text-lg" aria-hidden="true" />
    </span>
    <span
      v-if="auth.isAuthenticated && loyalty.data.value?.enabled && loyalty.data.value.balance > 0"
      class="pr-1 text-sm font-extrabold tabular-nums"
      >{{ loyalty.data.value.balance }}</span
    >
  </button>
</template>
