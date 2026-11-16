<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatPrice } from '@/utils/money'
import type { DeliveryQuote } from '../../api/delivery.service'

const props = defineProps<{
  quote: DeliveryQuote | null
  hasPoint: boolean
  ready: boolean
  pending: boolean
  selecting: boolean
  needsZoom: boolean
  error: boolean
  subtotal: number
}>()
const { t } = useI18n()
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
const amount = computed(() => {
  const quote = props.quote
  if (quote?.price == null) return ''
  return quote.price === 0 ? t('common.free') : formatPrice(quote.price)
})
const hint = computed(() => {
  if (props.needsZoom) return t('delivery.zoomIn')
  if (props.selecting || props.pending) return t('delivery.checking')
  if (props.error) return t('delivery.unavailableShort')
  if (props.quote?.status === 'outside_zones') return t('delivery.outside')
  if (props.quote?.status === 'no_coordinates') return t('delivery.noPoint')
  if (!props.hasPoint && !props.ready) return t('delivery.selectAddress')
  if (props.quote && props.quote.status !== 'ok' && props.quote.status !== 'below_minimum')
    return t('delivery.unavailableShort')
  return props.ready ? t('delivery.checking') : t('delivery.selectAddress')
})
const detail = computed(() => {
  const quote = props.quote
  if (!fresh.value || !quote) return null
  if (quote.status === 'below_minimum' && quote.min_order != null)
    return t('delivery.minimumAdd', {
      sum: formatPrice(quote.min_order),
      missing: formatPrice(Math.max(0, quote.min_order - props.subtotal)),
    })
  if (quote.price && quote.free_from != null)
    return t('delivery.freeFrom', { sum: formatPrice(quote.free_from) })
  return null
})
</script>

<template>
  <div class="flex min-w-0 max-w-full items-center gap-1.5" data-testid="delivery-quote-caption">
    <div v-if="fresh" class="flex min-w-0 flex-1 flex-col text-left leading-tight">
      <span class="whitespace-nowrap text-xs text-gray-500">{{ t('delivery.costTitle') }}</span>
      <span class="block text-sm font-semibold break-words text-gray-900" :title="amount">{{
        amount
      }}</span>
      <span v-if="detail" class="text-xs leading-tight text-gray-600">{{ detail }}</span>
    </div>
    <div v-else class="flex min-w-0 flex-1 flex-col text-left leading-tight">
      <span class="whitespace-nowrap text-xs text-gray-500">{{ t('delivery.costTitle') }}</span>
      <span class="block text-xs break-words text-gray-600" :title="hint ?? undefined">{{
        hint
      }}</span>
    </div>
  </div>
</template>
