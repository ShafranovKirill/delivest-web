<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useContactsStore } from '@/modules/widgets/contacts/stores/constacts.store'
import { useOrderStore } from '../stores/order.store'
import { computed } from 'vue'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useOrderSuccessQuery } from '../composables/useOrderSuccessQuery'
import OrderSuccessHero from './success/OrderSuccessHero.vue'
import OrderSuccessDetails from './success/OrderSuccessDetails.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const contactsStore = useContactsStore()
const orderStore = useOrderStore()
const branchStore = useBranchStore()
const { t } = useI18n()
const sourceOrder = computed(() => orderStore.lastCreatedOrder)
const liveOrder = useOrderSuccessQuery(sourceOrder)
const order = computed(() => {
  const source = sourceOrder.value
  if (!source || source.branch_id !== branchStore.activeBranch?.id) return null
  return liveOrder.data.value?.id === source.id ? liveOrder.data.value : source
})

function handleReturnHome() {
  orderStore.resetOrderState()
  router.push('/')
}
</script>

<template>
  <div class="mx-auto flex max-w-lg flex-col gap-3 sm:gap-4">
    <OrderSuccessHero v-if="order" :key="order.id" :order="order" />

    <div
      v-if="order?.status === 'created' && !order.awaiting_payment"
      class="rounded-3xl bg-gray-50 px-5 py-4 text-sm text-gray-500"
    >
      <p class="font-semibold text-gray-800">{{ t('order.success.operatorCall') }}</p>
      <i18n-t keypath="order.success.hint" tag="p" class="mt-1 leading-relaxed">
        <template #time>
          <span class="font-semibold text-gray-900">{{ t('order.success.hintTime') }}</span>
        </template>
      </i18n-t>
    </div>

    <OrderSuccessDetails v-if="order" :order="order" />

    <div class="flex flex-col gap-2 sm:flex-row sm:gap-3">
      <Button
        :label="t('order.success.backToMenu')"
        class="h-14 flex-1 rounded-full! font-semibold sm:order-last"
        @click="handleReturnHome"
      />
      <Button
        v-if="contactsStore.phone"
        as="a"
        :href="`tel:${contactsStore.phone}`"
        :label="t('common.callUs')"
        icon="pi pi-phone"
        severity="secondary"
        class="h-14 flex-1 rounded-full! font-semibold"
      />
    </div>
  </div>
</template>
