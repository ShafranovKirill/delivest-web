<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useContactsStore } from '@/modules/widgets/contacts/stores/constacts.store'
import { useOrderStore } from '../stores/order.store'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
import OrderPushPrompt from '@/modules/pwa/components/OrderPushPrompt.vue'
import OrderSuccessHero from './success/OrderSuccessHero.vue'
import OrderSuccessDetails from './success/OrderSuccessDetails.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const contactsStore = useContactsStore()
const orderStore = useOrderStore()
const { t } = useI18n()

function handleReturnHome() {
  orderStore.resetOrderState()
  router.push('/')
}
</script>

<template>
  <div class="mx-auto flex max-w-lg flex-col gap-3 sm:gap-4">
    <OrderSuccessHero :order="orderStore.lastCreatedOrder" />

    <SurfaceCard icon="pi-phone" :title="t('order.success.operatorCall')">
      <i18n-t keypath="order.success.hint" tag="p" class="text-sm text-gray-500 leading-relaxed">
        <template #time>
          <span class="font-semibold text-gray-900">{{ t('order.success.hintTime') }}</span>
        </template>
      </i18n-t>
    </SurfaceCard>

    <OrderSuccessDetails v-if="orderStore.lastCreatedOrder" :order="orderStore.lastCreatedOrder" />

    <OrderPushPrompt :order-id="orderStore.lastCreatedOrder?.id" />

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
