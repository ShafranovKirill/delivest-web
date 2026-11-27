<script setup lang="ts">
import OrderEarnings from '@/modules/account/components/OrderEarnings.vue'

import { computed, ref, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import ResponsiveSheet from '@/modules/shared/components/ui/ResponsiveSheet.vue'
import Button from 'primevue/button'
import { OrderService, type ActiveOrder } from '../../api/order.service'
import { ACTIVE_ORDERS_KEY } from '../../composables/useActiveOrdersQuery'
import { formatPrice } from '@/utils/money'
import {
  formatTime,
  fulfillmentLabel,
  paymentLabel,
  orderStatusLabel,
} from '../../utils/orderStatus'
import { useContactsStore } from '@/modules/widgets/contacts/stores/constacts.store'
import OrderStatusSteps from './OrderStatusSteps.vue'
import OrderCourierCard from './OrderCourierCard.vue'
import OrderPushPrompt from '@/modules/pwa/components/OrderPushPrompt.vue'
import OrderReceiptIllustration from './OrderReceiptIllustration.vue'
import { formatAddress, type AddressParts } from '@/modules/shared/utils/address'
import { useI18n } from 'vue-i18n'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { courierDetailsEnabled } from './courierVisibility'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { isCurrentPaymentRequest, type PaymentRequestContext } from './paymentRequestContext'

const props = defineProps<{ order: ActiveOrder | null; repeatable?: boolean }>()
const emit = defineEmits<{ close: []; repeat: [] }>()

const contactsStore = useContactsStore()
const branchStore = useBranchStore()
const authStore = useAuthStore()
const { t, locale } = useI18n()

const showCourier = computed(
  () =>
    props.order?.courier &&
    courierDetailsEnabled(
      props.order.branch_id,
      props.order.courier.provider,
      branchStore.branches,
      branchStore.activeBranch,
    ),
)

const visible = computed({
  get: () => props.order !== null,
  set: (value) => !value && emit('close'),
})

const queryClient = useQueryClient()
const confirmingCancel = ref(false)

watch(
  () => props.order?.id,
  () => (confirmingCancel.value = false),
)

const cancel = useMutation({
  mutationFn: (id: string) => OrderService.cancelOrder(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_KEY })
    emit('close')
  },
})

function cancelOrder() {
  if (!props.order) return
  if (!confirmingCancel.value) {
    confirmingCancel.value = true
    return
  }
  cancel.mutate(props.order.id)
}

const pay = useMutation({
  mutationFn: ({ orderId, fallback }: PaymentRequestContext & { fallback: boolean }) =>
    OrderService.getPaymentLink(orderId, fallback),
  onSuccess: (url, request) => {
    const current =
      props.order && props.order.branch_id === branchStore.activeBranch?.id
        ? {
            orderId: props.order.id,
            branchId: props.order.branch_id,
            sessionEpoch: authStore.sessionEpoch,
          }
        : null
    if (!isCurrentPaymentRequest(request, current)) return
    if (url) window.location.assign(url)
    else queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_KEY })
  },
})

const address = computed(() => formatAddress(props.order?.address as AddressParts | null))
const placedDate = computed(() =>
  props.order?.inserted_at
    ? new Date(props.order.inserted_at).toLocaleDateString(locale.value, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null,
)
</script>

<template>
  <ResponsiveSheet
    :aria-label="order ? t('order.number', { number: order.short_number }) : t('nav.myOrders')"
    v-model:visible="visible"
    desktop-class="w-[min(94vw,560px)]"
    :sheet-pt="{ footer: { class: 'border-t border-gray-100' } }"
    :desktop-pt="{
      root: { class: 'max-h-[92dvh] overflow-hidden rounded-4xl!' },
      content: { class: 'overflow-y-auto!' },
      footer: { class: 'border-t border-gray-100' },
    }"
  >
    <template #header>
      <div v-if="order" class="flex min-w-0 flex-1 items-center justify-between gap-2 pr-2">
        <div class="min-w-0">
          <h2 class="break-words text-xl font-extrabold leading-tight text-gray-950 sm:text-2xl">
            {{ t('order.number', { number: order.short_number }) }}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            <span v-if="placedDate">{{ placedDate }} · </span>
            {{ t('order.placedAt', { time: formatTime(order.inserted_at) }) }}
          </p>
        </div>
        <span class="receipt-art block h-16 w-16 shrink-0 text-primary-strong sm:h-24 sm:w-24">
          <OrderReceiptIllustration />
        </span>
      </div>
    </template>

    <div v-if="order" class="flex flex-col gap-5 pb-1">
      <div class="rounded-2xl bg-primary-soft px-4 py-4">
        <p class="mb-3 font-bold text-primary-strong">{{ orderStatusLabel(order) }}</p>
        <OrderStatusSteps v-if="order.status !== 'cancelled'" :order="order" />
      </div>

      <OrderCourierCard
        v-if="!repeatable && showCourier && order.courier"
        :courier="order.courier"
        :status="order.status"
      />
      <OrderPushPrompt v-if="!repeatable" :order-id="order.id" />

      <div class="grid grid-cols-2 gap-x-5 gap-y-4 border-b border-gray-200 pb-5 text-sm">
        <div class="col-span-2 min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {{ fulfillmentLabel(order.fulfillment_type) }}
          </p>
          <p class="mt-1 break-words font-semibold text-gray-950">
            {{
              address ||
              (order.fulfillment_type === 'delivery'
                ? t('order.addressByOperator')
                : t('order.atBranch'))
            }}
          </p>
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {{ t('order.time') }}
          </p>
          <p class="mt-1 font-semibold text-gray-950">
            {{
              order.cook_by
                ? t('order.cookBy', { time: formatTime(order.cook_by) })
                : t('order.asap')
            }}
          </p>
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {{ t('order.payment.title') }}
          </p>
          <p class="mt-1 font-semibold text-gray-950">{{ paymentLabel(order.payment_method) }}</p>
        </div>
        <div
          v-if="order.fulfillment_type === 'delivery' && order.promised_delivery_at"
          class="col-span-2"
        >
          <p class="font-semibold text-primary-strong">
            {{ t('order.confirmedDeliveryBy', { time: formatTime(order.promised_delivery_at) }) }}
          </p>
        </div>
        <div v-if="order.comment" class="col-span-2 min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {{ t('order.comment') }}
          </p>
          <p class="mt-1 break-words text-gray-800">{{ order.comment }}</p>
        </div>
      </div>

      <OrderEarnings :amount="order.points_earned" :status="order.status" />

      <section :aria-label="t('order.items')">
        <h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          {{ t('order.items') }}
        </h3>
        <ul class="space-y-3">
          <li
            v-for="(item, index) in order.items"
            :key="`${item.product_id}-${index}`"
            class="flex items-start justify-between gap-3 text-sm"
          >
            <div class="min-w-0">
              <p class="font-semibold text-gray-900">
                <i
                  v-if="item.gift"
                  class="pi pi-gift mr-1 text-xs text-green-700"
                  aria-hidden="true"
                />
                {{ item.title }}
              </p>
              <p
                v-for="modifier in item.modifiers ?? []"
                :key="modifier.id ?? modifier.name"
                class="mt-0.5 text-xs text-gray-500"
              >
                + {{ modifier.name }}
              </p>
            </div>
            <span v-if="item.gift" class="shrink-0 text-green-700">
              {{ t('order.giftCount', { count: item.quantity }) }}
            </span>
            <span v-else class="shrink-0 text-right tabular-nums text-gray-600">
              {{ item.quantity }} × {{ formatPrice(item.price) }}
            </span>
          </li>
        </ul>

        <div
          v-if="order.discount_amount > 0 || order.promotions.length"
          class="mt-4 space-y-2 border-t border-dashed border-gray-200 pt-4 text-sm"
        >
          <div class="flex justify-between gap-3 text-gray-500">
            <span>{{ t('common.withoutDiscount') }}</span>
            <span class="shrink-0 tabular-nums">{{ formatPrice(order.subtotal_amount) }}</span>
          </div>
          <div
            v-for="promotion in order.promotions"
            :key="promotion.name"
            class="flex justify-between gap-3 text-green-700"
          >
            <span>{{
              promotion.code ? t('order.promoCode', { code: promotion.code }) : promotion.name
            }}</span>
            <span v-if="promotion.discount > 0" class="shrink-0 tabular-nums">
              −{{ formatPrice(promotion.discount) }}
            </span>
          </div>
        </div>
        <div
          class="mt-4 flex justify-between gap-3 border-t border-dashed border-gray-300 pt-4 text-lg font-extrabold text-gray-950"
        >
          <span>{{ t('common.total') }}</span>
          <span class="tabular-nums">{{ formatPrice(order.total_amount) }}</span>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex w-full flex-col gap-2 pt-1">
        <Button
          v-if="repeatable"
          :label="t('account.orders.repeatOrder')"
          icon="pi pi-replay"
          class="h-11 w-full rounded-full! font-semibold"
          @click="emit('repeat')"
        />
        <Button
          v-if="!repeatable && order?.awaiting_payment"
          :label="
            order.saved_payment_fallback_available
              ? t('order.savedPayment.fallback', { amount: formatPrice(order.total_amount) })
              : t('order.pay.action')
          "
          :loading="pay.isPending.value"
          icon="pi pi-credit-card"
          class="h-11 w-full rounded-full! font-semibold"
          @click="
            pay.mutate({
              orderId: order.id,
              branchId: order.branch_id,
              sessionEpoch: authStore.sessionEpoch,
              fallback: order.saved_payment_fallback_available === true,
            })
          "
        />
        <p v-if="pay.isError.value" class="text-center text-sm text-red-600">
          {{
            order?.saved_payment_fallback_available
              ? t('order.savedPayment.fallbackFailed')
              : t('order.pay.failed')
          }}
        </p>
        <div
          v-if="(!repeatable && order?.can_cancel) || contactsStore.phone"
          class="grid gap-2"
          :class="
            !repeatable && order?.can_cancel && contactsStore.phone
              ? 'sm:grid-cols-2'
              : 'grid-cols-1'
          "
        >
          <Button
            v-if="!repeatable && order?.can_cancel"
            :label="confirmingCancel ? t('order.cancel.confirm') : t('order.cancel.action')"
            :loading="cancel.isPending.value"
            icon="pi pi-times"
            severity="danger"
            variant="outlined"
            class="h-10 w-full rounded-full! text-sm font-semibold"
            @click="cancelOrder"
          />
          <Button
            v-if="contactsStore.phone"
            as="a"
            :href="`tel:${contactsStore.phone}`"
            :label="t('common.callUs')"
            icon="pi pi-phone"
            severity="secondary"
            variant="outlined"
            class="h-10 w-full rounded-full! text-sm font-semibold"
          />
        </div>
      </div>
    </template>
  </ResponsiveSheet>
</template>

<style scoped>
.receipt-art {
  --receipt-paper: var(--surface-card, white);
}
</style>
