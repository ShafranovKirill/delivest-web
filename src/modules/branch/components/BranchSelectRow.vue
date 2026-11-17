<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Branch } from '../api/branch.service'
import { useBranchStatus } from '../composables/useBranchStatus'
import FulfillmentIllustration from '@/modules/fulfillment/components/FulfillmentIllustration.vue'

const props = withDefaults(
  defineProps<{
    branch: Branch
    selected?: boolean
    selecting?: boolean
  }>(),
  { selected: false, selecting: false },
)

defineEmits<{ select: [] }>()

const { t } = useI18n()
const { isOpen, label, hoursLabel } = useBranchStatus()

const open = computed(() => isOpen(props.branch))
const status = computed(() => label(props.branch))
const hours = computed(() => hoursLabel(props.branch))
</script>

<template>
  <button
    type="button"
    :disabled="selecting"
    :aria-current="selected ? 'true' : undefined"
    class="branch-select-row group relative isolate block min-h-28 w-full cursor-pointer overflow-hidden rounded-3xl p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:cursor-wait disabled:opacity-60 sm:min-h-31 sm:p-5"
    :class="selected ? 'ring-2 ring-inset ring-primary-strong' : ''"
    @click="$emit('select')"
  >
    <span
      class="relative z-10 flex min-w-0 flex-col items-start gap-1 break-words pr-[clamp(4.5rem,24vw,7rem)] sm:gap-1.5 sm:pr-36"
    >
      <span class="w-full text-base font-semibold leading-snug text-gray-900">{{
        branch.name
      }}</span>
      <span v-if="branch.branch_info?.address" class="w-full text-xs leading-snug text-gray-600">{{
        branch.branch_info.address
      }}</span>
      <span class="w-full text-xs leading-snug text-gray-600">{{ hours }}</span>
      <span
        class="mt-1 w-full text-xs font-medium leading-snug"
        :class="open ? 'text-primary-strong' : 'text-gray-600'"
      >
        {{ status }}
      </span>
    </span>
    <FulfillmentIllustration
      kind="pickup"
      class="pointer-events-none absolute right-3 top-1/2 z-0 w-[clamp(3.5rem,19vw,6rem)] -translate-y-1/2 text-primary-strong opacity-25 sm:right-0 sm:w-36"
      aria-hidden="true"
    />
    <span
      class="absolute right-4 top-4 z-10 text-primary-strong sm:right-5 sm:top-5"
      aria-hidden="true"
    >
      <i v-if="selecting" class="pi pi-spin pi-spinner text-sm" />
      <i v-else-if="selected" class="pi pi-check text-sm" />
      <i v-else class="pi pi-arrow-right text-sm" />
    </span>
    <span v-if="selected" class="sr-only">{{ t('branch.select.current') }}</span>
  </button>
</template>

<style scoped>
.branch-select-row {
  --summary-bg: color-mix(in srgb, var(--color-primary) 20%, var(--surface-card, white));
  --summary-bg-deep: color-mix(in srgb, var(--color-primary) 36%, var(--surface-card, white));
  background: var(--summary-bg);
}

.branch-select-row:hover {
  background: color-mix(in srgb, var(--color-primary) 25%, var(--surface-card, white));
}
</style>
