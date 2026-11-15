<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'

const { t } = useI18n()
const email = computed(() => useFranchiseStore().legal?.email ?? null)
</script>

<template>
  <a
    v-if="email"
    :href="`mailto:${email}`"
    class="group flex min-w-0 items-center justify-between gap-3 border-b border-gray-200 py-4"
  >
    <span class="min-w-0">
      <span class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {{ t('contacts.email') }}
      </span>
      <span
        class="block break-all font-semibold text-gray-900 transition-colors group-hover:text-primary"
      >
        {{ email }}
      </span>
    </span>
    <i class="pi pi-arrow-up-right shrink-0 text-sm text-gray-400" aria-hidden="true" />
  </a>
</template>
