<script setup lang="ts">
import { computed } from 'vue'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import { useI18n } from 'vue-i18n'

const franchiseStore = useFranchiseStore()
const { t } = useI18n()
const year = new Date().getFullYear()

const seller = computed(() => {
  const legal = franchiseStore.legal
  if (!legal) return []

  return [
    [legal.form, legal.name].filter(Boolean).join(' '),
    legal.inn && t('footer.inn', { value: legal.inn }),
    legal.ogrn && t('footer.ogrn', { value: legal.ogrn }),
    legal.address,
  ].filter(Boolean)
})
</script>

<template>
  <div
    class="flex flex-col md:flex-row md:items-start md:justify-between gap-2 text-xs text-gray-500"
  >
    <span class="shrink-0">© {{ year }} {{ franchiseStore.name }}</span>
    <span v-if="seller.length" class="md:text-right">{{ seller.join(' · ') }}</span>
  </div>
</template>
