<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import SkeletonText from '@/modules/shared/components/ui/SkeletonText.vue'
import ErrorComponent from '@/modules/shared/components/ErrorComponent.vue'
import LegalText from '../components/LegalText.vue'
import { FranchiseService, type LegalKind } from '../api/franchise.service'
import { intlLocale } from '@/i18n'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

const kind = computed(() => route.params.kind as LegalKind)

const {
  data: document,
  isLoading,
  isError,
  refetch,
} = useQuery({
  queryKey: computed(() => ['legal-document', kind.value]),
  queryFn: () => FranchiseService.getDocument(kind.value),
  staleTime: 10 * 60 * 1000,
})

const updatedAt = computed(() =>
  document.value?.updated_at
    ? t('legal.updatedAt', {
        date: new Date(document.value.updated_at).toLocaleDateString(intlLocale()),
      })
    : undefined,
)
</script>

<template>
  <PageShell :title="t(`legal.titles.${kind}`)" :subtitle="updatedAt" width="narrow">
    <SkeletonText v-if="isLoading" />
    <ErrorComponent v-else-if="isError" @retry="refetch" />
    <LegalText v-else-if="document" :body="document.body" />
  </PageShell>
</template>
