<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useContactsStore } from '@/modules/widgets/contacts/stores/constacts.store'
import { useOrderStore } from '../stores/order.store'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
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
    <SurfaceCard class="text-center">
      <div class="flex flex-col items-center gap-4 py-4">
        <span class="grid place-items-center size-16 rounded-full bg-primary text-white shadow-md">
          <i class="pi pi-check text-2xl" />
        </span>
        <div>
          <h2 class="text-2xl font-extrabold text-gray-950">{{ t('order.success.title') }}</h2>
          <p v-if="orderStore.lastCreatedOrder?.number" class="mt-1 text-gray-500">
            {{ t('order.success.number') }}
            <span class="font-bold text-gray-900">{{ orderStore.lastCreatedOrder.number }}</span>
          </p>
        </div>
      </div>
    </SurfaceCard>

    <SurfaceCard icon="pi-phone" :label="t('order.success.next')">
      <template #value>{{ t('order.success.operatorCall') }}</template>
      <i18n-t keypath="order.success.hint" tag="p" class="text-sm text-gray-500 leading-relaxed">
        <template #time>
          <span class="font-semibold text-gray-900">{{ t('order.success.hintTime') }}</span>
        </template>
      </i18n-t>
    </SurfaceCard>

    <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <Button
        v-if="contactsStore.phone"
        as="a"
        :href="`tel:${contactsStore.phone}`"
        :label="t('common.callUs')"
        icon="pi pi-phone"
        severity="secondary"
        class="h-14 flex-1 rounded-full! font-semibold"
      />
      <Button
        :label="t('order.success.backToMenu')"
        class="h-14 flex-1 rounded-full! font-semibold"
        @click="handleReturnHome"
      />
    </div>
  </div>
</template>
