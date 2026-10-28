<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFranchiseStore } from '@/modules/franchise/stores/franchise.store'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'

const { t } = useI18n()
const email = computed(() => useFranchiseStore().legal?.email ?? null)
</script>

<template>
  <SurfaceCard
    v-if="email"
    as="a"
    :href="`mailto:${email}`"
    icon="pi-envelope"
    :label="t('contacts.email')"
    class="hover:border-primary transition-colors"
  >
    <template #value>{{ email }}</template>
    <template #aside>
      <i class="pi pi-arrow-up-right text-gray-400" />
    </template>
  </SurfaceCard>
</template>
