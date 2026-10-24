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

const { data: orders, isLoading } = useMyOrdersQuery()
const { repeat, repeatingId } = useRepeatOrder()

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
        v-if="isLoading"
        :count="3"
        class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        item-class="h-44 rounded-3xl!"
      />

      <div v-else-if="orders?.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      <EmptyState
        v-else
        icon="pi-receipt"
        :title="t('account.orders.emptyTitle')"
        :text="t('account.orders.emptyText')"
      />

      <ActiveOrderModal
        :order="selected"
        repeatable
        @close="selectedId = null"
        @repeat="repeatSelected"
      />
    </AuthRequired>
  </PageShell>
</template>
