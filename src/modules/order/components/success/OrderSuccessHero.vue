<script setup lang="ts">
/// <reference types="unplugin-icons/types/vue" />
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Order, OrderStatus } from '../../api/order.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { formatAddress, type AddressParts } from '@/modules/shared/utils/address'
import { orderStatusIcon, orderStatusLabel } from '../../utils/orderStatus'
import CutleryIcon from '~icons/tabler/tools-kitchen-2'
import ReceiptIcon from '~icons/tabler/receipt'
import orderConfirmationBag from '@/assets/order-confirmation-bag.webp'

const props = defineProps<{ order: Order }>()
const { t, locale } = useI18n()
const branchStore = useBranchStore()
const playIntro = ref(props.order.status === 'created' && !props.order.awaiting_payment)
let introTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  if (playIntro.value) introTimer = setTimeout(() => (playIntro.value = false), 1150)
})
onUnmounted(() => clearTimeout(introTimer))

function formatDateTime(value: string): string {
  // Both timestamps represent UTC instants; an offset-free response is treated as UTC.
  const hasOffset = /(?:Z|[+-]\d\d:\d\d)$/i.test(value)
  const date = new Date(hasOffset ? value : `${value}Z`)
  return date.toLocaleString(locale.value, {
    timeZone: branchStore.activeBranch?.branch_info?.timezone ?? 'UTC',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const placedAt = computed(() =>
  props.order.inserted_at ? formatDateTime(props.order.inserted_at) : null,
)
const place = computed(() =>
  props.order.fulfillment_type === 'delivery'
    ? formatAddress(props.order.address as AddressParts | null) || t('order.addressByOperator')
    : branchStore.activeBranch?.branch_info?.address || t('order.atBranch'),
)
const eta = computed(() => {
  if (props.order.fulfillment_type === 'delivery' && props.order.promised_delivery_at)
    return t('order.confirmedDeliveryBy', {
      time: formatDateTime(props.order.promised_delivery_at),
    })
  if (
    props.order.status === 'cancelled' ||
    props.order.status === 'completed' ||
    props.order.awaiting_payment
  )
    return null
  if (props.order.cook_by) return t('order.cookBy', { time: formatDateTime(props.order.cook_by) })
  if (props.order.fulfillment_type === 'delivery' && props.order.estimated_delivery_at)
    return t('order.estimatedDeliveryBy', {
      time: formatDateTime(props.order.estimated_delivery_at),
    })
  if (props.order.estimated_ready_at)
    return t('order.cookBy', { time: formatDateTime(props.order.estimated_ready_at) })
  const info = branchStore.activeBranch?.branch_info
  const configured = info?.fixed_delivery_minutes ?? info?.delivery_time
  const minutes = typeof configured === 'number' && configured > 0 ? configured : 60
  return t(
    `order.timeSelect.${props.order.fulfillment_type === 'delivery' ? 'deliveryLead' : 'pickupLead'}`,
    {
      minutes:
        props.order.fulfillment_type === 'delivery'
          ? minutes
          : Math.max(20, Math.round(minutes / 2)),
    },
  )
})
const statusText = computed(() =>
  props.order.status === 'accepted' &&
  props.order.payment_method !== 'online' &&
  !props.order.awaiting_payment
    ? t('order.success.accepted')
    : orderStatusLabel(props.order),
)
const terminal = computed(() => props.order.status === 'cancelled')
const steps = computed(() => {
  const base: OrderStatus[] = ['created', 'accepted', 'preparing']
  return props.order.fulfillment_type === 'delivery'
    ? [...base, 'delivering', 'completed']
    : [...base, 'ready']
})
const activeIndex = computed(() => {
  if (props.order.awaiting_payment) return -1
  if (props.order.status === 'completed') return steps.value.length - 1
  if (props.order.status === 'ready' && props.order.fulfillment_type === 'delivery') return 2
  return steps.value.indexOf(props.order.status)
})
</script>

<template>
  <section class="order-success-hero">
    <div class="mb-4 text-left">
      <h1 class="text-3xl font-bold text-gray-950 sm:text-4xl">
        {{ t('order.number', { number: order.short_number }) }}
      </h1>
      <p class="mt-1 text-sm text-gray-500">{{ [placedAt, place].filter(Boolean).join(' · ') }}</p>
    </div>

    <div
      class="order-success-card overflow-hidden rounded-3xl shadow-sm ring-1 ring-gray-100"
      :class="{ 'is-success': !terminal && !order.awaiting_payment, 'is-intro': playIntro }"
    >
      <div
        data-order-summary
        class="grid items-center gap-2 px-5 py-5 sm:gap-4 sm:px-6"
        :class="
          !terminal && !order.awaiting_payment
            ? 'grid-cols-[minmax(0,1fr)_clamp(4.25rem,20vw,9rem)]'
            : 'grid-cols-1'
        "
      >
        <div class="flex min-w-0 items-start gap-2 text-left" aria-live="polite">
          <i
            v-if="order.awaiting_payment"
            :class="['pi', orderStatusIcon(order), 'shrink-0 text-lg text-gray-950']"
            aria-hidden="true"
          />
          <div class="min-w-0">
            <p
              v-if="!terminal && !order.awaiting_payment"
              class="mb-0.5 text-xs font-medium text-emerald-800"
            >
              {{ t('order.success.title') }}
            </p>
            <Transition name="status-update" mode="out-in">
              <h2
                :key="statusText"
                class="success-status min-w-0 break-words text-[18px] font-semibold leading-snug text-gray-950"
              >
                {{ statusText }}
              </h2>
            </Transition>
            <p v-if="eta" class="success-eta mt-1.5 text-sm leading-snug text-gray-600">
              {{ eta }}
            </p>
          </div>
        </div>
        <img
          v-if="!terminal && !order.awaiting_payment"
          :src="orderConfirmationBag"
          alt=""
          width="448"
          height="350"
          class="success-art pointer-events-none h-auto w-full justify-self-center object-contain"
          aria-hidden="true"
        />
      </div>
      <div class="success-stages">
        <div class="min-h-0 overflow-hidden">
          <div class="px-5 pb-6 sm:px-6">
            <div v-if="terminal" class="mt-4 text-center" :data-order-terminal="order.status">
              <i class="pi pi-times text-3xl text-gray-400" aria-hidden="true" />
            </div>
            <ol
              v-else
              class="flex items-center justify-between"
              :aria-label="t('order.success.stages')"
            >
              <template v-for="(step, index) in steps" :key="step">
                <li
                  class="success-step flex min-w-0 flex-1 items-center justify-center transition-colors duration-300"
                  :class="
                    index === activeIndex
                      ? 'text-gray-950'
                      : index < activeIndex
                        ? 'text-slate-600'
                        : 'text-slate-400'
                  "
                  :style="{ '--step-index': index }"
                  :aria-current="index === activeIndex ? 'step' : undefined"
                  :data-order-step="step"
                >
                  <span class="flex size-9 items-center justify-center">
                    <ReceiptIcon
                      v-if="step === 'created'"
                      class="size-6 sm:size-7"
                      aria-hidden="true"
                    />
                    <i-tabler-check
                      v-else-if="step === 'accepted'"
                      class="size-6 sm:size-7"
                      aria-hidden="true"
                    />
                    <i-tabler-soup
                      v-else-if="step === 'preparing'"
                      class="size-6 sm:size-7"
                      aria-hidden="true"
                    />
                    <i-tabler-truck
                      v-else-if="step === 'delivering'"
                      class="size-6 sm:size-7"
                      aria-hidden="true"
                    />
                    <CutleryIcon v-else class="size-6 sm:size-7" aria-hidden="true" />
                  </span>
                  <span class="sr-only">{{
                    step === 'accepted' ? t('order.success.accepted') : t(`order.status.${step}`)
                  }}</span>
                </li>
                <li
                  v-if="index < steps.length - 1"
                  class="flex shrink-0 gap-1"
                  role="presentation"
                  aria-hidden="true"
                >
                  <span
                    class="size-1 rounded-full"
                    :class="index < activeIndex ? 'bg-slate-500' : 'bg-slate-300'"
                  />
                </li>
              </template>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.order-success-card {
  background: #fff;
}
.order-success-card.is-success {
  background: linear-gradient(125deg, #ecf8ef 0%, #dff3e5 100%);
}
.is-intro {
  animation: success-card-enter 420ms ease-out both;
}
.is-intro .success-art {
  animation: success-art-enter 650ms ease-out both;
}
.is-intro .success-status {
  animation: success-detail-enter 400ms ease-out 150ms both;
}
.is-intro .success-eta {
  animation: success-detail-enter 400ms ease-out 280ms both;
}
.success-stages {
  display: grid;
  grid-template-rows: 1fr;
}
.is-intro .success-stages {
  animation: success-stages-enter 470ms ease-out 360ms both;
}
.is-intro .success-step > span:first-child {
  animation: success-detail-enter 370ms ease-out both;
  animation-delay: calc(400ms + var(--step-index) * 65ms);
}
.status-update-enter-active,
.status-update-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.status-update-enter-from {
  opacity: 0;
  transform: translateY(7px);
}
.status-update-leave-to {
  opacity: 0;
  transform: translateY(-7px);
}
@keyframes success-stages-enter {
  from {
    grid-template-rows: 0fr;
  }
  to {
    grid-template-rows: 1fr;
  }
}
@keyframes success-card-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes success-art-enter {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes success-detail-enter {
  from {
    opacity: 0;
    transform: translateY(7px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .is-intro,
  .is-intro .success-art,
  .is-intro .success-status,
  .is-intro .success-eta,
  .is-intro .success-stages,
  .is-intro .success-step > span:first-child {
    animation: none;
  }
  .status-update-enter-active,
  .status-update-leave-active {
    transition: none;
  }
}
</style>
