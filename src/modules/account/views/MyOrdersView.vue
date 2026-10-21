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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { data: orders, isLoading } = useMyOrdersQuery()

const selectedId = ref<string | null>(null)

const selected = computed<ActiveOrder | null>(
  () => orders.value?.find((order) => order.id === selectedId.value) ?? null,
)
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
        <ActiveOrderCard
          v-for="order in orders"
          :key="order.id"
          :order="order"
          class="bg-gray-50! border border-gray-100"
          @open="selectedId = $event.id"
        />
      </div>

      <EmptyState
        v-else
        icon="pi-receipt"
        :title="t('account.orders.emptyTitle')"
        :text="t('account.orders.emptyText')"
      />

      <ActiveOrderModal :order="selected" @close="selectedId = null" />
    </AuthRequired>
  </PageShell>
</template>
