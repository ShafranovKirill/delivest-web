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
    class="loyalty-glass group inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-primary outline-none transition duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
    :aria-label="t('loyalty.title')"
    aria-haspopup="dialog"
    :aria-expanded="modal.isOpen"
    @click="modal.open"
  >
    <span
      class="flex size-7 shrink-0 items-center justify-center text-primary transition-transform duration-200 group-hover:-rotate-12 motion-reduce:transition-none"
      aria-hidden="true"
    >
      <i class="pi pi-star-fill" style="font-size: 20px" />
    </span>
    <span class="text-sm font-extrabold leading-none whitespace-nowrap tabular-nums">{{
      balance > 0 ? balance : t('loyalty.categoryLabel')
    }}</span>
  </button>
</template>

<style scoped>
.loyalty-glass {
  background: linear-gradient(
    155deg,
    rgb(255 255 255 / 85%),
    color-mix(in srgb, var(--p-primary-500) 12%, transparent)
  );
  border-color: color-mix(in srgb, var(--p-primary-500) 16%, transparent);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 95%),
    inset 0 -1px 2px color-mix(in srgb, var(--p-primary-500) 8%, transparent),
    0 3px 10px color-mix(in srgb, var(--p-primary-500) 12%, transparent);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  backdrop-filter: blur(16px) saturate(150%);
}

.loyalty-glass:hover {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 95%),
    inset 0 -1px 2px color-mix(in srgb, var(--p-primary-500) 12%, transparent),
    0 4px 14px color-mix(in srgb, var(--p-primary-500) 20%, transparent);
}

.loyalty-glass:where(.dark *),
.loyalty-glass:where(.dark *):hover {
  background: linear-gradient(
    155deg,
    rgb(255 255 255 / 9%),
    rgb(20 20 26 / 45%) 45%,
    rgb(10 10 16 / 60%)
  );
  border-color: rgb(255 255 255 / 12%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 24%),
    inset 1px 0 1px rgb(255 255 255 / 7%),
    inset 0 -1px 2px rgb(0 0 0 / 25%),
    0 3px 10px rgb(0 0 0 / 20%);
}
</style>
