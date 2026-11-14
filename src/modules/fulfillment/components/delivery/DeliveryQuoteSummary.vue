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
      <div class="max-w-72 space-y-1 text-sm text-gray-700">
        <p class="font-bold text-gray-950">{{ t('delivery.conditions') }}</p>
        <p v-if="quote?.price != null">
          {{
            quote.price === 0
              ? t('delivery.free')
              : t('delivery.price', { price: formatPrice(quote.price) })
          }}
        </p>
        <p v-if="quote?.minutes != null">
          {{ t('delivery.zoneMinutes', { minutes: quote.minutes }) }}
        </p>
        <p v-if="quote?.min_order != null">
          {{ t('delivery.minimum', { sum: formatPrice(quote.min_order) }) }}
        </p>
        <p v-if="quote?.free_from != null">
          {{ t('delivery.freeFrom', { sum: formatPrice(quote.free_from) }) }}
        </p>
        <p v-for="tier in zone?.thresholds ?? []" :key="`${tier.order_from}:${tier.price}`">
          {{
            t('delivery.zoneTier', {
              sum: formatPrice(tier.order_from),
              price: tier.price === 0 ? t('delivery.free') : formatPrice(tier.price),
            })
          }}
        </p>
      </div>
    </Popover>
  </div>
</template>
