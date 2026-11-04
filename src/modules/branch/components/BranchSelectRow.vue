<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Branch } from '../api/branch.service'
import { useBranchStatus } from '../composables/useBranchStatus'

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
const { isOpen, label } = useBranchStatus()

const open = computed(() => isOpen(props.branch))
const status = computed(() => label(props.branch))
</script>

<template>
  <button
    type="button"
    :disabled="selecting"
    :aria-current="selected ? 'true' : undefined"
    class="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3.5 text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
    @click="$emit('select')"
  >
    <span
      class="min-w-0 break-words text-base font-semibold leading-snug text-gray-900 group-hover:text-primary"
    >
      {{ branch.name }}
    </span>

    <span class="flex shrink-0 items-center gap-2">
      <span
        class="inline-flex items-center gap-1.5 text-xs font-semibold"
        :class="open ? 'text-emerald-600' : 'text-red-500'"
      >
        <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
        {{ status }}
      </span>
      <i v-if="selecting" class="pi pi-spin pi-spinner text-sm text-primary" aria-hidden="true" />
      <i v-else-if="selected" class="pi pi-check text-sm text-primary" aria-hidden="true" />
      <span v-if="selected" class="sr-only">{{ t('branch.select.current') }}</span>
    </span>
  </button>
</template>
