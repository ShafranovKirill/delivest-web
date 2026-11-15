<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'

const { t } = useI18n()
const franchiseStore = useFranchiseStore()

const rows = computed(() => {
  const legal = franchiseStore.legal
  if (!legal) return []

  return [
    { label: t('contacts.seller'), value: [legal.form, legal.name].filter(Boolean).join(' ') },
    { label: t('contacts.inn'), value: legal.inn },
    { label: t('contacts.ogrn'), value: legal.ogrn },
    { label: t('contacts.legalAddress'), value: legal.address },
  ].filter((row) => Boolean(row.value))
})
</script>

<template>
  <section
    v-if="rows.length"
    class="min-w-0 border-t border-gray-200 pt-7"
    :aria-label="t('contacts.requisites')"
  >
    <h2 class="text-xs font-bold uppercase tracking-widest text-primary-strong">
      {{ t('contacts.requisites') }}
    </h2>
    <dl class="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 text-sm sm:grid-cols-2">
      <div v-for="row in rows" :key="row.label" class="min-w-0">
        <dt class="text-gray-500">{{ row.label }}</dt>
        <dd class="mt-1 font-semibold text-gray-900 break-words">{{ row.value }}</dd>
      </div>
    </dl>
  </section>
</template>
