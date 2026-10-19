<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useContactsStore } from '@/modules/widgets/contacts/stores/constacts.store'
import { useOrderStore } from '../stores/order.store'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'

const router = useRouter()
const contactsStore = useContactsStore()
const orderStore = useOrderStore()

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
          <h2 class="text-2xl font-extrabold text-gray-950">Заказ принят!</h2>
          <p v-if="orderStore.lastCreatedOrder?.number" class="mt-1 text-gray-500">
            Номер заказа
            <span class="font-bold text-gray-900">{{ orderStore.lastCreatedOrder.number }}</span>
          </p>
        </div>
      </div>
    </SurfaceCard>

    <SurfaceCard icon="pi-phone" label="Что дальше">
      <template #value>Оператор позвонит для подтверждения</template>
      <p class="text-sm text-gray-500 leading-relaxed">
        Обычно это занимает до <span class="font-semibold text-gray-900">5 минут</span>. Если звонка
        нет — позвоните нам сами.
      </p>
    </SurfaceCard>

    <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <Button
        v-if="contactsStore.phone"
        as="a"
        :href="`tel:${contactsStore.phone}`"
        label="Позвонить нам"
        icon="pi pi-phone"
        severity="secondary"
        class="h-14 flex-1 rounded-full! font-semibold"
      />
      <Button
        label="Вернуться в меню"
        class="h-14 flex-1 rounded-full! font-semibold"
        @click="handleReturnHome"
      />
    </div>
  </div>
</template>
