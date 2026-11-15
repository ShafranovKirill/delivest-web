<script setup lang="ts">
/// <reference types="unplugin-icons/types/vue" />
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Order, OrderStatus } from '../../api/order.service'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { formatAddress, type AddressParts } from '@/modules/shared/utils/address'
import { orderStatusIcon, orderStatusLabel } from '../../utils/orderStatus'
import CutleryIcon from '~icons/tabler/tools-kitchen-2'

const props = defineProps<{ order: Order }>()
const { t, locale } = useI18n()
const branchStore = useBranchStore()

const expanded = ref(false)
let introTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  if (props.order.status === 'created' && !props.order.awaiting_payment)
    introTimer = setTimeout(() => (expanded.value = true), 700)
  else expanded.value = true
})
onUnmounted(() => clearTimeout(introTimer))
watch(
  () => [props.order.status, props.order.awaiting_payment],
  () => {
    if (props.order.status !== 'created' || props.order.awaiting_payment) {
      clearTimeout(introTimer)
      expanded.value = true
    }
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
      :class="{ 'is-success': !terminal && !order.awaiting_payment }"
    >
      <div
        v-if="!terminal && !order.awaiting_payment"
        class="success-art pointer-events-none absolute right-3 top-2 size-20 sm:right-5 sm:top-1 sm:size-24"
        aria-hidden="true"
      >
        <svg viewBox="0 0 104 104" fill="none" focusable="false">
          <g class="success-spark success-spark-a" fill="#48a76c">
            <path d="m14 26 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" />
          </g>
          <g class="success-spark success-spark-b" fill="#70bd8a">
            <path d="m87 13 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5 1.5-4Z" />
          </g>
          <circle class="success-spark success-spark-c" cx="95" cy="46" r="2.5" fill="#48a76c" />
          <circle class="success-spark success-spark-d" cx="22" cy="88" r="2" fill="#70bd8a" />
          <g transform="rotate(-7 51 51)">
            <rect
              x="25"
              y="12"
              width="56"
              height="77"
              rx="7"
              fill="#fff"
              stroke="#b9e4c7"
              stroke-width="2"
            />
            <path d="M64 12v13h17" stroke="#d4ecdc" stroke-width="2" />
            <circle cx="38" cy="34" r="4" fill="#75c392" />
            <path
              d="M48 34h19M35 49h34M35 59h26"
              stroke="#b8dcca"
              stroke-width="3"
              stroke-linecap="round"
            />
          </g>
          <path
            d="m76 57 5 3 6-1 3 6 6 3-1 7 4 5-4 5 1 7-6 3-3 6-6-1-5 3-5-3-6 1-3-6-6-3 1-7-4-5 4-5-1-7 6-3 3-6 6 1 5-3Z"
            fill="#23824b"
          />
          <path
            class="success-check"
            d="m66 79 7 7 14-15"
            stroke="white"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <div
        class="relative flex min-h-28 w-[70%] items-start gap-3 px-5 py-5 sm:px-6"
        aria-live="polite"
      >
        <i
          :class="[
            'pi',
            expanded && terminal ? 'pi-times' : expanded ? orderStatusIcon(order) : 'pi-check',
            'text-xl text-gray-950',
          ]"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <p
            v-if="expanded && !terminal && !order.awaiting_payment"
            class="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-800"
          >
            {{ t('order.success.title') }}
          </p>
          <Transition name="success-text" mode="out-in">
            <h2
              :key="expanded ? statusText : t('order.success.title')"
              class="break-words font-semibold leading-snug text-gray-950"
            >
              {{ expanded ? statusText : t('order.success.title') }}
            </h2>
          </Transition>
        </div>
      </div>
      <div class="success-expand" :class="{ 'is-expanded': expanded }">
        <div class="min-h-0 overflow-hidden">
          <div class="px-5 pb-6 sm:px-6">
            <p v-if="eta" class="mb-5 text-sm text-gray-600">{{ eta }}</p>

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
              class="mt-5 flex items-center justify-between"
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
.success-art {
  animation: success-art-pop 0.7s cubic-bezier(0.2, 1.3, 0.4, 1) both;
}
.success-check {
  stroke-dasharray: 32;
  stroke-dashoffset: 32;
  animation: success-check-draw 0.55s ease-out 0.2s forwards;
}
.success-spark {
  transform-origin: center;
  animation: success-spark-burst 0.6s ease-out 0.2s both;
}
.success-spark-b {
  animation-delay: 0.3s;
}
.success-spark-c {
  animation-delay: 0.4s;
}
.success-spark-d {
  animation-delay: 0.5s;
}
@keyframes success-art-pop {
  from {
    opacity: 0;
    transform: scale(0.75) rotate(-12deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}
@keyframes success-spark-burst {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes success-check-draw {
  to {
    stroke-dashoffset: 0;
  }
}
.success-expand {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.7s ease,
    opacity 0.7s ease;
}
.success-expand.is-expanded {
  grid-template-rows: 1fr;
  opacity: 1;
}
.success-text-enter-active,
.success-text-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.success-text-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.success-text-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
@media (prefers-reduced-motion: reduce) {
  .success-art,
  .success-spark,
  .success-check,
  .success-expand,
  .success-text-enter-active,
  .success-text-leave-active {
    transition: none;
    animation: none;
  }
  .success-check {
    stroke-dashoffset: 0;
  }
}
</style>
