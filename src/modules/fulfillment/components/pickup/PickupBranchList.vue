<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Branch } from '@/modules/branch/api/branch.service'
import { branchLngLat } from '../../utils/branchLocation'

defineProps<{ branches: Branch[]; selectedId: string | null }>()
defineEmits<{ select: [branch: Branch] }>()

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-2">
    <button
      v-for="branch in branches"
      :key="branch.id"
      type="button"
      class="flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors cursor-pointer"
      :class="
        branch.id === selectedId
          ? 'border-primary bg-primary-soft'
          : 'border-gray-200 bg-white hover:border-primary'
      "
      @click="$emit('select', branch)"
    >
      <i class="pi pi-shop text-primary" />
      <span class="min-w-0 flex-1">
        <span class="block truncate font-semibold text-gray-900">{{ branch.name }}</span>
        <span v-if="branch.branch_info?.address" class="block truncate text-sm text-gray-500">
          {{ branch.branch_info.address }}
        </span>
      </span>
      <span v-if="!branchLngLat(branch)" class="shrink-0 text-xs text-gray-400">
        {{ t('fulfillment.notOnMap') }}
      </span>
    </button>
  </div>
</template>
