<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Order, OrderStatus } from '../../api/order.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBranchStore } from '@/modules/branch/stores/branch.store'
import { useStarsLabel } from '@/modules/account/composables/useStarsLabel'
import { formatAddress, type AddressParts } from '@/modules/shared/utils/address'
import { orderStatusIcon, orderStatusLabel } from '../../utils/orderStatus'

const props = defineProps<{ order: Order }>()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const branchStore = useBranchStore()
const starsLabel = useStarsLabel()

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

const earned = computed(() => {
  const rate = branchStore.activeBranch?.branch_info?.loyalty
  if (!authStore.isAuthenticated || !rate?.enabled) return 0
  return props.order.points_earned ?? 0
})
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
const terminal = computed(
  () => props.order.status === 'cancelled' || props.order.status === 'completed',
)
const steps = computed(() => {
  const last: OrderStatus = props.order.fulfillment_type === 'delivery' ? 'delivering' : 'ready'
  return ['created', 'accepted', 'preparing', last] as OrderStatus[]
})
const activeIndex = computed(() => {
  if (props.order.awaiting_payment) return -1
  if (props.order.status === 'ready' && props.order.fulfillment_type === 'delivery') return 2
  return steps.value.indexOf(props.order.status)
})
const stepIcon: Record<OrderStatus, string> = {
  created: 'pi-check',
  accepted: 'pi-check-circle',
  preparing: 'pi-hourglass',
  ready: 'pi-shopping-bag',
  delivering: 'pi-truck',
  completed: 'pi-check',
  cancelled: 'pi-times',
}
</script>

<template>
  <section class="order-success-hero">
    <div class="mb-4 text-center">
      <h1 class="text-xl font-bold text-gray-950 sm:text-2xl">
        {{ t('order.number', { number: order.short_number }) }}
      </h1>
      <p class="mt-1 text-sm text-gray-500">{{ [placedAt, place].filter(Boolean).join(' · ') }}</p>
    </div>

    <div class="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
      <div class="flex items-center gap-3 px-5 py-4 sm:px-6" aria-live="polite">
        <i
          :class="[
            'pi',
            expanded ? (terminal ? stepIcon[order.status] : orderStatusIcon(order)) : 'pi-check',
            'text-xl text-gray-950',
          ]"
          aria-hidden="true"
        />
        <Transition name="success-text" mode="out-in">
          <h2
            :key="expanded ? statusText : t('order.success.title')"
            class="font-semibold text-gray-950"
          >
            {{ expanded ? statusText : t('order.success.title') }}
          </h2>
        </Transition>
      </div>
      <div class="success-expand" :class="{ 'is-expanded': expanded }">
        <div class="min-h-0 overflow-hidden">
          <div class="border-t border-gray-100 px-5 pb-6 pt-5 sm:px-6">
            <div class="text-center">
              <p v-if="eta" class="mt-1 text-sm text-gray-500">{{ eta }}</p>
            </div>

            <div v-if="terminal" class="mt-6 text-center" :data-order-terminal="order.status">
              <i
                :class="[
                  'pi',
                  stepIcon[order.status],
                  'text-3xl',
                  order.status === 'cancelled' ? 'text-gray-400' : 'text-gray-950',
                ]"
                aria-hidden="true"
              />
            </div>
            <ol
              v-else
              class="mt-7 flex items-start justify-between"
              :aria-label="t('order.success.stages')"
            >
              <template v-for="(step, index) in steps" :key="step">
                <li
                  class="flex min-w-0 flex-1 flex-col items-center gap-2 text-center transition-colors duration-300"
                  :class="index <= activeIndex ? 'text-gray-950' : 'text-gray-400'"
                  :aria-current="index === activeIndex ? 'step' : undefined"
                  :data-order-step="step"
                >
                  <i :class="['pi', stepIcon[step], 'text-xl']" aria-hidden="true" />
                  <span class="text-[11px] leading-tight sm:text-xs">{{
                    step === 'accepted' ? t('order.success.accepted') : t(`order.status.${step}`)
                  }}</span>
                </li>
                <li
                  v-if="index < steps.length - 1"
                  class="mt-2 flex shrink-0 gap-1"
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
            <p
              v-if="earned > 0 && order.status !== 'cancelled'"
              class="mt-5 text-center text-sm font-semibold text-amber-700"
            >
              <i class="pi pi-star-fill mr-1" aria-hidden="true" />
              +{{ t('loyalty.afterCompleted', { stars: starsLabel(earned) }) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
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
  .success-expand,
  .success-text-enter-active,
  .success-text-leave-active {
    transition: none;
  }
}
</style>
