<script setup lang="ts">
import { computed, ref } from 'vue'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'
import SkeletonList from '@/modules/shared/components/ui/SkeletonList.vue'
import AuthRequired from '@/modules/auth/components/AuthRequired.vue'
import ActiveOrderCard from '@/modules/order/components/active/ActiveOrderCard.vue'
import ActiveOrderModal from '@/modules/order/components/active/ActiveOrderModal.vue'
import type { ActiveOrder } from '@/modules/order/api/order.service'
import { useMyOrdersQuery } from '../composables/useMyOrdersQuery'
import { useRepeatOrder } from '../composables/useRepeatOrder'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const {
  data: history,
  isPending,
  isError,
  isFetchNextPageError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
} = useMyOrdersQuery()
const { repeat, repeatingId } = useRepeatOrder()

const orders = computed(() => {
  const seen = new Set<string>()
  return (
    history.value?.pages.flatMap((page) =>
      page.data.filter((order) => {
        if (seen.has(order.id)) return false
        seen.add(order.id)
        return true
      }),
    ) ?? []
  )
})

const selectedId = ref<string | null>(null)

const selected = computed<ActiveOrder | null>(
  () => orders.value?.find((order) => order.id === selectedId.value) ?? null,
)

function repeatSelected() {
  const order = selected.value
  selectedId.value = null
  if (order) repeat(order)
}
</script>

<template>
  <PageShell :title="t('account.orders.title')" width="wide">
    <AuthRequired :text="t('account.orders.authText')">
      <SkeletonList
        v-if="isPending && !isError"
        :count="3"
        class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        item-class="h-44 rounded-3xl!"
      />

      <div v-else-if="orders.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="order in orders"
          :key="order.id"
          class="flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-gray-50"
        >
          <ActiveOrderCard
            :order="order"
            class="bg-transparent! shadow-none! hover:scale-100!"
            @open="selectedId = $event.id"
          />
          <button
            type="button"
            class="flex h-11 items-center justify-center gap-2 border-t border-gray-100 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft disabled:opacity-60 cursor-pointer"
            :disabled="repeatingId !== null"
            @click="repeat(order)"
          >
            <i v-if="repeatingId === order.id" class="pi pi-spin pi-spinner text-xs" />
            <i-tabler-repeat v-else class="size-4" />
            {{ t('account.orders.repeat') }}
          </button>
        </div>
      </div>

      <div v-if="isError && !orders.length" class="flex flex-col items-center gap-3 py-8">
        <p role="alert" class="text-sm text-red-700">{{ t('account.orders.loadError') }}</p>
        <button type="button" class="text-sm font-semibold text-primary" @click="refetch()">
          {{ t('common.retry') }}
        </button>
      </div>

      <div
        v-if="isError && orders.length && !isFetchNextPageError"
        class="mt-4 flex items-center justify-center gap-3"
      >
        <p role="alert" class="text-sm text-red-700">{{ t('account.orders.loadError') }}</p>
        <button type="button" class="text-sm font-semibold text-primary" @click="refetch()">
          {{ t('common.retry') }}
        </button>
      </div>

      <EmptyState
        v-else-if="!isPending && !isError && !orders.length"
        icon="pi-receipt"
        :title="t('account.orders.emptyTitle')"
        :text="t('account.orders.emptyText')"
      />

      <div
        v-if="orders.length && (hasNextPage || isFetchNextPageError)"
        class="mt-6 flex flex-col items-center gap-2"
      >
        <p v-if="isFetchNextPageError" role="alert" class="text-sm text-red-700">
          {{ t('account.orders.loadMoreError') }}
        </p>
        <button
          type="button"
          class="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          :disabled="isFetchingNextPage"
          @click="fetchNextPage()"
        >
          <i v-if="isFetchingNextPage" class="pi pi-spin pi-spinner mr-2 text-xs" />
          {{ isFetchNextPageError ? t('common.retry') : t('account.orders.loadMore') }}
        </button>
      </div>

      <ActiveOrderModal
        :order="selected"
        repeatable
        @close="selectedId = null"
        @repeat="repeatSelected"
      />
    </AuthRequired>
  </PageShell>
</template>
