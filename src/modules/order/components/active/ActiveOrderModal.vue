<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import type { ActiveOrder } from '../../api/order.service'
import {
  FULFILLMENT_LABELS,
  PAYMENT_LABELS,
  formatPrice,
  formatTime,
} from '../../utils/orderStatus'
import { useContactsStore } from '@/modules/widgets/contacts/stores/constacts.store'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
import OrderStatusSteps from './OrderStatusSteps.vue'

const props = defineProps<{ order: ActiveOrder | null }>()
const emit = defineEmits<{ close: [] }>()

const contactsStore = useContactsStore()

const visible = computed({
  get: () => props.order !== null,
  set: (value) => !value && emit('close'),
})

const address = computed(() => {
  const address = props.order?.address as Record<string, string | null> | null | undefined
  if (!address) return null

  return [
    address.street,
    address.house && `д. ${address.house}`,
    address.apartment && `кв. ${address.apartment}`,
    address.entrance && `подъезд ${address.entrance}`,
    address.floor && `этаж ${address.floor}`,
  ]
    .filter(Boolean)
    .join(', ')
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    dismissable-mask
    :draggable="false"
    class="w-[min(92vw,480px)]"
    :pt="{ root: { class: 'rounded-4xl! overflow-hidden' } }"
  >
    <template #header>
      <div v-if="order">
        <h2 class="text-xl font-extrabold text-gray-950">Заказ {{ order.number }}</h2>
        <p class="text-sm text-gray-500">Оформлен в {{ formatTime(order.inserted_at) }}</p>
      </div>
    </template>

    <div v-if="order" class="flex flex-col gap-3">
      <SurfaceCard>
        <OrderStatusSteps :order="order" detailed />
      </SurfaceCard>

      <SurfaceCard
        :icon="order.fulfillment_type === 'delivery' ? 'pi-map-marker' : 'pi-shopping-bag'"
        :label="FULFILLMENT_LABELS[order.fulfillment_type]"
      >
        <template #value>
          {{
            address ||
            (order.fulfillment_type === 'delivery' ? 'Адрес уточнит оператор' : 'В филиале')
          }}
        </template>
      </SurfaceCard>

      <div class="grid grid-cols-2 gap-3">
        <SurfaceCard icon="pi-clock" label="Время">
          <template #value>
            {{ order.cook_by ? `К ${formatTime(order.cook_by)}` : 'Как можно скорее' }}
          </template>
        </SurfaceCard>
        <SurfaceCard icon="pi-wallet" label="Оплата">
          <template #value>{{ PAYMENT_LABELS[order.payment_method] }}</template>
        </SurfaceCard>
      </div>

      <SurfaceCard v-if="order.comment" icon="pi-comment" label="Комментарий">
        <template #value>{{ order.comment }}</template>
      </SurfaceCard>

      <SurfaceCard label="Состав заказа">
        <ul class="flex flex-col gap-2">
          <li
            v-for="item in order.items"
            :key="item.product_id"
            class="flex items-baseline justify-between gap-3 text-sm"
          >
            <span class="text-gray-800">{{ item.title }}</span>
            <span class="shrink-0 text-gray-500 tabular-nums">
              {{ item.quantity }} × {{ formatPrice(item.price) }}
            </span>
          </li>
        </ul>
        <div
          class="mt-3 flex justify-between border-t border-gray-200 pt-3 font-extrabold text-gray-950"
        >
          <span>Итого</span>
          <span class="tabular-nums">{{ formatPrice(order.total_amount) }}</span>
        </div>
      </SurfaceCard>
    </div>

    <template #footer>
      <div class="flex w-full flex-col gap-2 pt-2">
        <Button
          v-if="contactsStore.phone"
          as="a"
          :href="`tel:${contactsStore.phone}`"
          label="Позвонить нам"
          icon="pi pi-phone"
          severity="secondary"
          class="h-12 w-full rounded-full! font-semibold"
        />
        <Button
          label="Закрыть"
          class="h-12 w-full rounded-full! font-semibold"
          @click="emit('close')"
        />
      </div>
    </template>
  </Dialog>
</template>
