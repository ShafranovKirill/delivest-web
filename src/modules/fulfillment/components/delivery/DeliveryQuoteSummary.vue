<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Popover from 'primevue/popover'
import { useI18n } from 'vue-i18n'
import { formatPrice } from '@/utils/money'
import type { DeliveryQuote, DeliveryZone } from '../../api/delivery.service'

const props = defineProps<{
  quote: DeliveryQuote | null
  zones: DeliveryZone[]
  pending: boolean
  selecting: boolean
  needsZoom: boolean
  error: boolean
}>()
const { t } = useI18n()
const popover = ref<InstanceType<typeof Popover> | null>(null)
const fresh = computed(
  () =>
    !props.pending &&
    !props.selecting &&
    !props.needsZoom &&
    !props.error &&
    (props.quote?.status === 'ok' || props.quote?.status === 'below_minimum'),
)
const zone = computed(() => props.zones.find((item) => item.id === props.quote?.zone_id))
const shortText = computed(() => {
  if (props.needsZoom) return t('delivery.zoomIn')
  if (props.selecting || props.pending) return t('delivery.checkingShort')
  if (props.error) return t('delivery.unavailableShort')
  const quote = props.quote
  if (!quote) return t('delivery.noPoint')
  if (quote.status === 'outside_zones') return t('delivery.outside')
  if (quote.status === 'no_coordinates') return t('delivery.noPoint')
  if (quote.status !== 'ok' && quote.status !== 'below_minimum')
    return t('delivery.unavailableShort')
  const amount =
    quote.price == null
      ? null
      : quote.price === 0
        ? t('delivery.free')
        : t('delivery.price', { price: formatPrice(quote.price) })
  const time = quote.minutes == null ? null : t('delivery.zoneMinutes', { minutes: quote.minutes })
  return [amount, time].filter(Boolean).join(' · ') || t('delivery.checkingShort')
})
watch(
  () => [props.quote, props.pending, props.selecting, props.needsZoom, props.error],
  () => popover.value?.hide(),
)
</script>

<template>
  <div
    class="flex h-11 min-w-0 items-center gap-2 rounded-2xl bg-white px-4 text-sm text-gray-700 shadow-md ring-1 ring-gray-100"
    data-testid="delivery-quote-caption"
    :title="shortText"
  >
    <span class="min-w-0 flex-1 truncate font-medium">{{ shortText }}</span>
    <button
      v-if="fresh"
      type="button"
      :aria-label="t('delivery.conditions')"
      class="grid size-8 shrink-0 place-items-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
      @click="popover?.toggle($event)"
    >
      <span aria-hidden="true">?</span>
    </button>
    <Popover ref="popover">
      <div class="max-w-72 space-y-1 text-sm text-gray-700">
        <p class="font-bold text-gray-950">{{ t('delivery.conditions') }}</p>
        <p v-if="quote?.zone_name" class="font-semibold text-gray-950">{{ quote.zone_name }}</p>
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
