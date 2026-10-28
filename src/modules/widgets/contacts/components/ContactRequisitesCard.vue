<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'

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
  <SurfaceCard v-if="rows.length" icon="pi-building" :label="t('contacts.requisites')">
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
      <div v-for="row in rows" :key="row.label" class="min-w-0">
        <dt class="text-gray-500">{{ row.label }}</dt>
        <dd class="font-semibold text-gray-900 break-words">{{ row.value }}</dd>
      </div>
    </dl>
  </SurfaceCard>
</template>
