<script setup lang="ts">
import type { Branch } from '@/modules/branch/api/branch.service'

defineProps<{ branches: Branch[]; compact?: boolean; disabled?: boolean }>()
defineEmits<{ select: [branch: Branch] }>()

const rows = new Map<string, HTMLButtonElement>()
function setRow(id: string, element: unknown) {
  if (typeof HTMLButtonElement !== 'undefined' && element instanceof HTMLButtonElement)
    rows.set(id, element)
  else rows.delete(id)
}
function focusBranch(id: string) {
  rows.get(id)?.focus()
}
defineExpose({ focusBranch })
</script>

<template>
  <div class="flex flex-col gap-2" data-testid="pickup-branch-list" :data-compact="compact">
    <button
      v-for="branch in branches"
      :key="branch.id"
      :ref="(element) => setRow(branch.id, element)"
      type="button"
      :disabled="disabled"
      class="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-primary"
      data-testid="pickup-branch-row"
      :data-branch-id="branch.id"
      @click="$emit('select', branch)"
    >
      <span class="min-w-0 flex-1">
        <span
          class="block font-semibold text-gray-900"
          :class="compact ? 'break-words' : 'truncate'"
          >{{ branch.name }}</span
        >
        <span
          v-if="branch.branch_info?.address"
          class="block text-sm text-gray-500"
          :class="compact ? 'break-words' : 'truncate'"
        >
          {{ branch.branch_info.address }}
        </span>
      </span>
      <i
        v-if="!compact"
        class="pi pi-chevron-right shrink-0 text-sm text-gray-400"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
