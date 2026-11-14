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
  if (!props.hasPoint) return t('delivery.selectAddress')
  if (props.selecting || props.pending) return t('delivery.checking')
  if (props.error) return t('delivery.unavailableShort')
  if (props.quote?.status === 'outside_zones') return t('delivery.outside')
  if (props.quote?.status === 'no_coordinates') return t('delivery.noPoint')
  if (props.quote && props.quote.status !== 'ok' && props.quote.status !== 'below_minimum')
    return t('delivery.unavailableShort')
  return props.ready ? t('delivery.checking') : t('delivery.selectAddress')
})
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
  </div>
</template>
