<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ActiveOrder } from '../../api/order.service'
import { useActiveOrdersQuery } from '../../composables/useActiveOrdersQuery'
import ActiveOrderCard from './ActiveOrderCard.vue'
import ActiveOrderModal from './ActiveOrderModal.vue'
import { useI18n } from 'vue-i18n'

const { data: orders } = useActiveOrdersQuery()
const { t } = useI18n()

const selectedId = ref<string | null>(null)

const selected = computed<ActiveOrder | null>(
  () => orders.value?.find((order) => order.id === selectedId.value) ?? null,
)
</script>

<template>
  <section v-if="orders?.length" class="w-full max-w-7xl mx-auto px-4 pb-4">
    <h2 class="mb-2 px-2 text-lg font-extrabold text-gray-950">{{ t('order.active') }}</h2>

    <div
      class="flex snap-x gap-3 overflow-x-auto px-2 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3"
    >
      <ActiveOrderCard
        v-for="order in orders"
        :key="order.id"
        :order="order"
        class="w-[min(82vw,320px)] shrink-0 snap-start sm:w-auto"
        @open="selectedId = $event.id"
      />
    </div>

    <ActiveOrderModal :order="selected" @close="selectedId = null" />
  </section>
</template>
