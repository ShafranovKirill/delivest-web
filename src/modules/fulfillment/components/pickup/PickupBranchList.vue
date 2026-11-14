<script setup lang="ts">
import type { Branch } from '@/modules/branch/api/branch.service'

defineProps<{ branches: Branch[] }>()
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
  <div class="flex flex-col gap-2" data-testid="pickup-branch-list">
    <button
      v-for="branch in branches"
      :key="branch.id"
      :ref="(element) => setRow(branch.id, element)"
      type="button"
      class="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-primary"
      data-testid="pickup-branch-row"
      :data-branch-id="branch.id"
      @click="$emit('select', branch)"
    >
      <span class="min-w-0 flex-1">
        <span class="block truncate font-semibold text-gray-900">{{ branch.name }}</span>
        <span v-if="branch.branch_info?.address" class="block truncate text-sm text-gray-500">
          {{ branch.branch_info.address }}
        </span>
      </span>
      <i class="pi pi-chevron-right shrink-0 text-sm text-gray-400" aria-hidden="true" />
    </button>
  </div>
</template>
