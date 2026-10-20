<script setup lang="ts">
import { computed, ref } from 'vue'
import PageShell from '@/modules/shared/components/ui/PageShell.vue'
import EmptyState from '@/modules/shared/components/ui/EmptyState.vue'
import AuthRequired from '@/modules/auth/components/AuthRequired.vue'
import ActiveOrderCard from '@/modules/order/components/active/ActiveOrderCard.vue'
import ActiveOrderModal from '@/modules/order/components/active/ActiveOrderModal.vue'
import type { ActiveOrder } from '@/modules/order/api/order.service'
import { useMyOrdersQuery } from '../composables/useMyOrdersQuery'

const { data: orders, isLoading } = useMyOrdersQuery()

const selectedId = ref<string | null>(null)

const selected = computed<ActiveOrder | null>(
  () => orders.value?.find((order) => order.id === selectedId.value) ?? null,
)
</script>

<template>
  <PageShell title="Мои заказы" width="wide">
    <AuthRequired text="Здесь появится история ваших заказов">
      <div v-if="isLoading" class="py-16 text-center">
        <i class="pi pi-spin pi-spinner text-3xl text-primary" />
      </div>

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
        title="Заказов пока нет"
        text="Оформите первый заказ — он появится здесь"
      />

      <ActiveOrderModal :order="selected" @close="selectedId = null" />
    </AuthRequired>
  </PageShell>
</template>
