<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Popover from 'primevue/popover'
import { useI18n } from 'vue-i18n'
import { formatPrice } from '@/utils/money'
import type { DeliveryQuote, DeliveryZone } from '../../api/delivery.service'

const props = defineProps<{
  quote: DeliveryQuote | null
  zones: DeliveryZone[]
  ready: boolean
  pending: boolean
  selecting: boolean
  needsZoom: boolean
  error: boolean
}>()
const { t } = useI18n()
const popover = ref<InstanceType<typeof Popover> | null>(null)
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
  if (!props.ready || props.selecting || props.pending) return null
  if (props.needsZoom) return t('delivery.zoomIn')
  if (props.error) return t('delivery.unavailableShort')
  if (props.quote?.status === 'outside_zones') return t('delivery.outside')
  if (props.quote?.status === 'no_coordinates') return t('delivery.noPoint')
  if (props.quote && props.quote.status !== 'ok' && props.quote.status !== 'below_minimum')
    return t('delivery.unavailableShort')
  return null
})
watch(
  () => [props.quote, props.ready, props.pending, props.selecting, props.needsZoom, props.error],
  () => popover.value?.hide(),
)
</script>

<template>
  <div v-if="fresh || hint" class="flex shrink-0 items-center gap-1.5" data-testid="delivery-quote-caption">
    <div v-if="fresh" class="flex flex-col text-left leading-tight">
      <span class="text-xs text-gray-500">{{ t('delivery.line') }}</span>
      <span class="whitespace-nowrap text-sm font-semibold text-gray-900">{{ amount }}</span>
    </div>
    <span v-else class="max-w-28 text-xs leading-tight text-gray-600">{{ hint }}</span>
    <button
      v-if="fresh"
      type="button"
      :aria-label="t('delivery.conditions')"
      class="grid size-7 shrink-0 place-items-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
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
