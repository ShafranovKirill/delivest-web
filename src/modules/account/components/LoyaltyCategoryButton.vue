<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useLoyaltyQuery } from '../composables/useLoyaltyQuery'
import { useLoyaltyModalStore } from '../stores/loyalty.store'
const branch = useBranchStore()
const auth = useAuthStore()
const modal = useLoyaltyModalStore()
const loyalty = useLoyaltyQuery()
const { t } = useI18n()
const balance = computed(() =>
  auth.isAuthenticated && loyalty.data.value?.enabled ? loyalty.data.value.balance : 0,
)
</script>
<template>
  <button
    v-if="branch.activeBranch?.branch_info?.loyalty?.enabled"
    id="loyalty-category-button"
    type="button"
    class="inline-flex h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border-[3px] border-primary bg-transparent text-primary outline-none transition hover:bg-primary-soft active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    :class="balance > 0 ? 'px-3' : 'w-11'"
    :aria-label="t('loyalty.title')"
    aria-haspopup="dialog"
    :aria-expanded="modal.isOpen"
    @click="modal.open"
  >
    <i class="pi pi-star-fill text-lg" aria-hidden="true" />
    <span v-if="balance > 0" class="text-sm font-extrabold leading-none tabular-nums">{{
      balance
    }}</span>
  </button>
</template>
