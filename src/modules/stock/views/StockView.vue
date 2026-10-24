<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStocksQuery } from '../composables/useStocksQuery'
import { useRunningPromotionsQuery } from '../composables/useRunningPromotionsQuery'
import { useStoryRoute } from '../composables/useStoryRoute'
import StoryCard from '../components/StoryCard.vue'
import StoryViewer from '../components/StoryViewer.vue'
import RunningPromotionCard from '../components/RunningPromotionCard.vue'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'
import SkeletonList from '@/modules/shared/components/ui/SkeletonList.vue'

const { t } = useI18n()
const stocksQuery = useStocksQuery()
const promotionsQuery = useRunningPromotionsQuery()
const { open } = useStoryRoute()

const stocks = computed(() => stocksQuery.data.value ?? [])
const promotions = computed(() => promotionsQuery.data.value ?? [])
const isLoading = computed(() => stocksQuery.isLoading.value || promotionsQuery.isLoading.value)
const isEmpty = computed(() => !stocks.value.length && !promotions.value.length)
</script>

<template>
  <PageShell :title="t('stock.title')" :subtitle="t('stock.subtitle')" width="wide">
    <SkeletonList
      v-if="isLoading"
      :count="2"
      class="grid gap-3 sm:grid-cols-2"
      item-class="h-28 rounded-3xl!"
    />

    <EmptyState
      v-else-if="isEmpty"
      icon="pi-percentage"
      :title="t('stock.emptyTitle')"
      :text="t('stock.emptyText')"
    />

    <div v-else class="flex flex-col gap-8 sm:gap-10">
      <section v-if="promotions.length">
        <h2 class="text-xl sm:text-2xl font-extrabold text-gray-950">{{ t('stock.running') }}</h2>
        <p class="mt-1 text-sm text-gray-500">{{ t('stock.runningHint') }}</p>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <RunningPromotionCard
            v-for="promotion in promotions"
            :key="promotion.id"
            :promotion="promotion"
          />
        </div>
      </section>

      <section v-if="stocks.length">
        <h2 class="text-xl sm:text-2xl font-extrabold text-gray-950">{{ t('stock.specials') }}</h2>
        <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-1">
          <StoryCard
            v-for="stock in stocks"
            :key="stock.id"
            :story="stock"
            @open="open(stock.id!)"
          />
        </div>
      </section>
    </div>

    <StoryViewer />
  </PageShell>
</template>
