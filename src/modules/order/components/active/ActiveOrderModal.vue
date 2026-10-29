<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import type { ActiveOrder } from '../../api/order.service'
import { formatPrice, formatTime, fulfillmentLabel, paymentLabel } from '../../utils/orderStatus'
import { useContactsStore } from '@/modules/widgets/contacts/stores/constacts.store'
import SurfaceCard from '@/modules/shared/components/ui/SurfaceCard.vue'
import OrderStatusSteps from './OrderStatusSteps.vue'
import OrderCourierCard from './OrderCourierCard.vue'
import OrderPushPrompt from '@/modules/pwa/components/OrderPushPrompt.vue'
import { formatAddress, type AddressParts } from '@/modules/shared/utils/address'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ order: ActiveOrder | null; repeatable?: boolean }>()
const emit = defineEmits<{ close: []; repeat: [] }>()

const contactsStore = useContactsStore()
const { t } = useI18n()

const visible = computed({
  get: () => props.order !== null,
  set: (value) => !value && emit('close'),
})

const address = computed(() => formatAddress(props.order?.address as AddressParts | null))
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
        <h2 class="text-xl font-extrabold text-gray-950">
          {{ t('order.number', { number: order.number }) }}
        </h2>
        <p class="text-sm text-gray-500">
          {{ t('order.placedAt', { time: formatTime(order.inserted_at) }) }}
        </p>
      </div>
    </template>

    <div v-if="order" class="flex flex-col gap-3">
      <SurfaceCard>
        <OrderStatusSteps :order="order" detailed />
      </SurfaceCard>

      <OrderCourierCard
        v-if="!repeatable && order.courier"
        :courier="order.courier"
        :status="order.status"
      />

      <OrderPushPrompt v-if="!repeatable" :order-id="order.id" />

      <SurfaceCard
        :icon="order.fulfillment_type === 'delivery' ? 'pi-map-marker' : 'pi-shopping-bag'"
        :label="fulfillmentLabel(order.fulfillment_type)"
      >
        <template #value>
          {{
            address ||
            (order.fulfillment_type === 'delivery'
              ? t('order.addressByOperator')
              : t('order.atBranch'))
          }}
        </template>
      </SurfaceCard>

      <div class="grid grid-cols-2 gap-3">
        <SurfaceCard icon="pi-clock" :label="t('order.time')">
          <template #value>
            {{
              order.cook_by
                ? t('order.cookBy', { time: formatTime(order.cook_by) })
                : t('order.asap')
            }}
          </template>
        </SurfaceCard>
        <SurfaceCard icon="pi-wallet" :label="t('order.payment.title')">
          <template #value>{{ paymentLabel(order.payment_method) }}</template>
        </SurfaceCard>
      </div>

      <SurfaceCard v-if="order.comment" icon="pi-comment" :label="t('order.comment')">
        <template #value>{{ order.comment }}</template>
      </SurfaceCard>

      <SurfaceCard :label="t('order.items')">
        <ul class="flex flex-col gap-2">
          <li
            v-for="(item, index) in order.items"
            :key="`${item.product_id}-${index}`"
            class="flex items-baseline justify-between gap-3 text-sm"
          >
            <span class="text-gray-800">
              <i v-if="item.gift" class="pi pi-gift text-xs text-green-700" />
              {{ item.title }}
            </span>
            <span v-if="item.gift" class="shrink-0 text-green-700">
              {{ t('order.giftCount', { count: item.quantity }) }}
            </span>
            <span v-else class="shrink-0 text-gray-500 tabular-nums">
              {{ item.quantity }} × {{ formatPrice(item.price) }}
            </span>
          </li>
        </ul>
        <div
          v-if="order.discount_amount > 0 || order.promotions.length"
          class="mt-3 flex flex-col gap-1 border-t border-gray-200 pt-3 text-sm"
        >
          <div class="flex justify-between text-gray-500">
            <span>{{ t('common.withoutDiscount') }}</span>
            <span class="tabular-nums">{{ formatPrice(order.subtotal_amount) }}</span>
          </div>
          <div
            v-for="promotion in order.promotions"
            :key="promotion.name"
            class="flex justify-between text-green-700"
          >
            <span>{{
              promotion.code ? t('order.promoCode', { code: promotion.code }) : promotion.name
            }}</span>
            <span v-if="promotion.discount > 0" class="tabular-nums">
              −{{ formatPrice(promotion.discount) }}
            </span>
          </div>
        </div>
        <div
          class="mt-3 flex justify-between border-t border-gray-200 pt-3 font-extrabold text-gray-950"
        >
          <span>{{ t('common.total') }}</span>
          <span class="tabular-nums">{{ formatPrice(order.total_amount) }}</span>
        </div>
      </SurfaceCard>
    </div>

    <template #footer>
      <div class="flex w-full flex-col gap-2 pt-2">
        <Button
          v-if="repeatable"
          :label="t('account.orders.repeatOrder')"
          icon="pi pi-replay"
          class="h-12 w-full rounded-full! font-semibold"
          @click="emit('repeat')"
        />
        <Button
          v-if="contactsStore.phone"
          as="a"
          :href="`tel:${contactsStore.phone}`"
          :label="t('common.callUs')"
          icon="pi pi-phone"
          severity="secondary"
          class="h-12 w-full rounded-full! font-semibold"
        />
        <Button
          :label="t('common.close')"
          :severity="repeatable ? 'secondary' : undefined"
          class="h-12 w-full rounded-full! font-semibold"
          @click="emit('close')"
        />
      </div>
    </template>
  </Dialog>
</template>
