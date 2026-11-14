<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import Popover from 'primevue/popover'
import { useI18n } from 'vue-i18n'
import { formatPrice } from '@/utils/money'
import type { DeliveryQuote, DeliveryZone } from '../../api/delivery.service'

const props = defineProps<{
  quote: DeliveryQuote | null
  zones: DeliveryZone[]
  hasPoint: boolean
  ready: boolean
  pending: boolean
  selecting: boolean
  needsZoom: boolean
  error: boolean
}>()
const { t } = useI18n()
const popover = ref<InstanceType<typeof Popover> | null>(null)
const popoverOpen = ref(false)
const conditionsId = useId()
const fresh = computed(
  () =>
    props.ready &&
    !props.pending &&
    !props.selecting &&
    !props.needsZoom &&
    !props.error &&
    props.quote?.price != null &&
    (props.quote.status === 'ok' || props.quote.status === 'below_minimum'),
)
const zone = computed(() => props.zones.find((item) => item.id === props.quote?.zone_id))
const tiers = computed(
  () =>
    (zone.value?.thresholds ?? []).filter(
      (tier) => !(tier.price === 0 && tier.order_from === props.quote?.free_from),
    ),
)
const amount = computed(() => {
  const quote = props.quote
  if (quote?.price == null) return ''
  return quote.price === 0 ? t('common.free') : formatPrice(quote.price)
})
const hint = computed(() => {
  if (props.needsZoom) return t('delivery.zoomIn')
  if (!props.hasPoint) return t('delivery.selectAddress')
  if (props.selecting || props.pending) return t('delivery.checking')
  if (props.error) return t('delivery.unavailableShort')
  if (props.quote?.status === 'outside_zones') return t('delivery.outside')
  if (props.quote?.status === 'no_coordinates') return t('delivery.noPoint')
  if (props.quote && props.quote.status !== 'ok' && props.quote.status !== 'below_minimum')
    return t('delivery.unavailableShort')
  return props.ready ? t('delivery.checking') : t('delivery.selectAddress')
})
watch(
  () => [props.quote, props.ready, props.pending, props.selecting, props.needsZoom, props.error],
  () => popover.value?.hide(),
)
</script>

<template>
  <div
    class="flex w-max max-w-full min-w-0 items-center gap-1.5"
    data-testid="delivery-quote-caption"
  >
    <div v-if="fresh" class="flex min-w-0 flex-1 flex-col text-left leading-tight">
      <span class="whitespace-nowrap text-xs text-gray-500">{{ t('delivery.costTitle') }}</span>
      <span class="block truncate text-sm font-semibold text-gray-900" :title="amount">{{
        amount
      }}</span>
    </div>
    <div v-else class="flex min-w-0 flex-1 flex-col text-left leading-tight">
      <span class="whitespace-nowrap text-xs text-gray-500">{{ t('delivery.costTitle') }}</span>
      <span class="block truncate text-xs text-gray-600" :title="hint ?? undefined">{{
        hint
      }}</span>
    </div>
    <button
      v-if="fresh"
      type="button"
      :aria-label="t('delivery.conditions')"
      :aria-expanded="popoverOpen"
      :aria-controls="conditionsId"
      class="grid size-7 shrink-0 place-items-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
      @click="popover?.toggle($event)"
    >
      <span aria-hidden="true">?</span>
    </button>
    <Popover
      :id="conditionsId"
      ref="popover"
      @show="popoverOpen = true"
      @hide="popoverOpen = false"
    >
      <div class="w-[min(18rem,calc(100vw-3rem))] space-y-3 text-sm text-gray-700">
        <p class="font-semibold text-gray-950">{{ t('delivery.conditions') }}</p>
        <dl class="space-y-2">
          <div v-if="quote?.price != null" class="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
            <dt>{{ t('delivery.costTitle') }}</dt>
            <dd class="font-medium text-gray-950">
              {{ quote.price === 0 ? t('common.free') : formatPrice(quote.price) }}
            </dd>
          </div>
          <div
            v-if="quote?.minutes != null"
            class="flex flex-wrap justify-between gap-x-3 gap-y-0.5"
          >
            <dt>{{ t('delivery.conditionsTime') }}</dt>
            <dd class="font-medium text-gray-950">
              {{ t('delivery.conditionsAroundMinutes', { minutes: quote.minutes }) }}
            </dd>
          </div>
          <div
            v-if="quote?.min_order != null"
            class="flex flex-wrap justify-between gap-x-3 gap-y-0.5"
          >
            <dt>{{ t('delivery.conditionsMinimum') }}</dt>
            <dd class="font-medium text-gray-950">{{ formatPrice(quote.min_order) }}</dd>
          </div>
          <div
            v-if="quote?.free_from != null"
            class="flex flex-wrap justify-between gap-x-3 gap-y-0.5"
          >
            <dt>{{ t('delivery.conditionsFree') }}</dt>
            <dd class="font-medium text-gray-950">
              {{ t('delivery.conditionsFrom', { sum: formatPrice(quote.free_from) }) }}
            </dd>
          </div>
        </dl>
        <div v-if="tiers.length" class="space-y-2 border-t border-gray-200 pt-3">
          <p class="font-medium text-gray-950">{{ t('delivery.conditionsTiers') }}</p>
          <dl class="space-y-2">
            <div
              v-for="tier in tiers"
              :key="`${tier.order_from}:${tier.price}`"
              class="flex flex-wrap justify-between gap-x-3 gap-y-0.5"
            >
              <dt>{{ t('delivery.conditionsFrom', { sum: formatPrice(tier.order_from) }) }}</dt>
              <dd class="font-medium text-gray-950">
                {{ tier.price === 0 ? t('common.free') : formatPrice(tier.price) }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Popover>
  </div>
</template>
