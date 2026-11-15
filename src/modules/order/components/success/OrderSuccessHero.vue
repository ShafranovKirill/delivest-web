<script setup lang="ts">
/// <reference types="unplugin-icons/types/vue" />
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Order, OrderStatus } from '../../api/order.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { formatAddress, type AddressParts } from '@/modules/shared/utils/address'
import { orderStatusIcon, orderStatusLabel } from '../../utils/orderStatus'
import CutleryIcon from '~icons/tabler/tools-kitchen-2'
import orderConfirmationBag from '@/assets/order-confirmation-bag.webp'

const props = defineProps<{ order: Order }>()
const { t, locale } = useI18n()
const branchStore = useBranchStore()

const playIntro = ref(props.order.status === 'created' && !props.order.awaiting_payment)
watch(
  () => [props.order.status, props.order.awaiting_payment],
  () => {
    if (props.order.status !== 'created' || props.order.awaiting_payment) playIntro.value = false
  },
)

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
  if (
    props.order.status === 'cancelled' ||
    props.order.status === 'completed' ||
    props.order.awaiting_payment
  )
    return null
  if (props.order.cook_by) return t('order.cookBy', { time: formatDateTime(props.order.cook_by) })
  const configured = branchStore.activeBranch?.branch_info?.delivery_time
  if (typeof configured !== 'number' || configured <= 0) return null
  const minutes =
    props.order.fulfillment_type === 'delivery'
      ? configured
      : Math.max(20, Math.round(configured / 2))
  return t(
    `order.timeSelect.${props.order.fulfillment_type === 'delivery' ? 'deliveryLead' : 'pickupLead'}`,
    { minutes },
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
      class="order-success-card relative overflow-hidden rounded-3xl shadow-sm ring-1 ring-gray-100"
      :class="{ 'is-success': !terminal && !order.awaiting_payment, 'is-intro': playIntro }"
    >
      <div
        data-order-summary
        class="grid items-center gap-3 px-5 py-5 sm:gap-4 sm:px-6"
        :class="
          !terminal && !order.awaiting_payment
            ? 'grid-cols-[minmax(0,1fr)_clamp(6rem,29vw,9rem)]'
            : 'grid-cols-1'
        "
      >
        <div class="flex min-w-0 items-start gap-3" aria-live="polite">
          <i
            :class="[
              'pi',
              terminal ? 'pi-times' : orderStatusIcon(order),
              'shrink-0 text-xl text-gray-950',
            ]"
            aria-hidden="true"
          />
          <div class="min-w-0">
            <p
              v-if="!terminal && !order.awaiting_payment"
              class="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-800"
            >
              {{ t('order.success.title') }}
            </p>
            <h2 class="break-words font-semibold leading-snug text-gray-950">
              {{ statusText }}
            </h2>
            <div v-if="eta" class="success-expand success-eta">
              <div class="min-h-0 overflow-hidden">
                <p class="mt-3 text-sm text-gray-600">{{ eta }}</p>
              </div>
            </div>
          </div>
        </div>
        <img
          v-if="!terminal && !order.awaiting_payment"
          :src="orderConfirmationBag"
          alt=""
          class="success-art pointer-events-none relative -top-1.5 h-auto w-full justify-self-center self-center object-contain sm:-top-2"
          aria-hidden="true"
        />
      </div>
      <div class="success-expand success-stages">
        <div class="min-h-0 overflow-hidden">
          <div class="px-5 pb-6 sm:px-6">
            <div v-if="terminal" class="mt-6 text-center" :data-order-terminal="order.status">
              <i
                :class="[
                  'pi',
                  'pi-times',
                  'text-3xl',
                  order.status === 'cancelled' ? 'text-gray-400' : 'text-gray-950',
                ]"
                aria-hidden="true"
              />
            </div>
            <ol
              v-else
              class="flex items-center justify-between"
              :aria-label="t('order.success.stages')"
            >
              <template v-for="(step, index) in steps" :key="step">
                <li
                  class="flex min-w-0 flex-1 items-center justify-center transition-colors duration-300"
                  :class="index <= activeIndex ? 'text-gray-950' : 'text-gray-400'"
                  :aria-current="index === activeIndex ? 'step' : undefined"
                  :data-order-step="step"
                >
                  <i-tabler-hourglass v-if="step === 'created'" class="size-7" aria-hidden="true" />
                  <i-tabler-check
                    v-else-if="step === 'accepted'"
                    class="size-7"
                    aria-hidden="true"
                  />
                  <i-tabler-soup
                    v-else-if="step === 'preparing'"
                    class="size-7"
                    aria-hidden="true"
                  />
                  <i-tabler-truck
                    v-else-if="step === 'delivering'"
                    class="size-7"
                    aria-hidden="true"
                  />
                  <CutleryIcon v-else class="size-7" aria-hidden="true" />
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
                    :class="index < activeIndex ? 'bg-gray-950' : 'bg-gray-300'"
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
  animation: success-card-enter 0.34s ease-out backwards;
}
.is-intro .success-art {
  animation: success-detail-enter 0.4s ease-out 0.08s backwards;
}
.is-intro .success-eta {
  animation: success-expand-enter 0.36s ease-out 0.25s backwards;
}
.is-intro .success-stages {
  animation: success-expand-enter 0.36s ease-out 0.34s backwards;
}
@keyframes success-card-enter {
  from {
    transform: translateY(8px);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes success-detail-enter {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes success-expand-enter {
  from {
    grid-template-rows: 0fr;
    opacity: 0;
  }
  to {
    grid-template-rows: 1fr;
    opacity: 1;
  }
}
.success-expand {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .is-intro,
  .is-intro .success-art,
  .is-intro .success-eta,
  .is-intro .success-stages {
    animation: none;
  }
}
</style>
