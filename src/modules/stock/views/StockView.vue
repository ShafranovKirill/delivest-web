<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStocksQuery } from '../composables/useStocksQuery'
import { useStoryRoute } from '../composables/useStoryRoute'
import StoryViewer from '../components/StoryViewer.vue'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'

const { t } = useI18n()
const { data } = useStocksQuery()
const { open } = useStoryRoute()

const stocks = computed(() => data.value ?? [])
</script>

<template>
  <PageShell :title="t('stock.title')" :subtitle="t('stock.subtitle')" width="wide">
    <div
      v-if="stocks.length"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
    >
      <button
        v-for="stock in stocks"
        :key="stock.id"
        type="button"
        class="group flex flex-col overflow-hidden rounded-3xl bg-gray-50 border border-gray-100 text-left cursor-pointer hover:border-primary transition-colors"
        @click="open(stock.id!)"
      >
        <span class="block aspect-4/5 w-full overflow-hidden bg-gray-100">
          <img
            :src="stock.photo_url"
            :alt="stock.text || t('stock.single')"
            class="size-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </span>
        <span
          v-if="stock.text"
          class="px-3 py-3 text-sm font-semibold text-gray-800 line-clamp-2 leading-snug"
        >
          {{ stock.text }}
        </span>
      </button>
    </div>

    <EmptyState
      v-else
      icon="pi-percentage"
      :title="t('stock.emptyTitle')"
      :text="t('stock.emptyText')"
    />

    <StoryViewer />
  </PageShell>
</template>
