<script setup lang="ts">
import { computed, useId } from 'vue'
import type { OrderStatus } from '../../api/order.service'
import createdIcon from '@/assets/order-status/created.svg?raw'
import acceptedIcon from '@/assets/order-status/accepted.svg?raw'
import preparingIcon from '@/assets/order-status/preparing.svg?raw'
import readyIcon from '@/assets/order-status/ready.svg?raw'
import deliveringIcon from '@/assets/order-status/delivering.svg?raw'
import completedIcon from '@/assets/order-status/completed.svg?raw'
import cancelledIcon from '@/assets/order-status/cancelled.svg?raw'
import awaitingPaymentIcon from '@/assets/order-status/awaiting-payment.svg?raw'

const props = defineProps<{ status: OrderStatus; awaitingPayment?: boolean }>()
const instanceId = `order-status-${useId()}`

const icon = computed(() => {
  if (props.awaitingPayment) return awaitingPaymentIcon

  switch (props.status) {
    case 'accepted':
      return acceptedIcon
    case 'preparing':
      return preparingIcon
    case 'ready':
      return readyIcon
    case 'delivering':
      return deliveringIcon
    case 'completed':
      return completedIcon
    case 'cancelled':
      return cancelledIcon
    default:
      return createdIcon
  }
})

// These SVG strings come only from static repository assets.
const iconSource = computed(() => {
  const svg = icon.value.trim()
  const [x = 0, y = 0, width = 160, height = 120] = (
    svg.match(/^<svg\b[^>]*\bviewBox="([^"]+)"/)?.[1] ?? '0 0 160 120'
  )
    .split(/\s+/)
    .map(Number)
  const scalePadding =
    !props.awaitingPayment && (props.status === 'created' || props.status === 'accepted')
      ? 1.25 / 0.85
      : 1.25
  const frameWidth = Math.max(width, (height * 4) / 3) * scalePadding
  const frameHeight = Math.max(height, (width * 3) / 4) * scalePadding
  const viewBox = [
    x - (frameWidth - width) / 2,
    y - (frameHeight - height) / 2,
    frameWidth,
    frameHeight,
  ].join(' ')
  const body = svg.replace(/^<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const ids = new Map(
    [...body.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, `${instanceId}-${id}`]),
  )

  return {
    viewBox,
    body: body
      .replace(/\bid="([^"]+)"/g, (_, id: string) => `id="${ids.get(id)}"`)
      .replace(/url\(#([^)]+)\)/g, (_, id: string) => `url(#${ids.get(id) ?? id})`),
  }
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="iconSource.viewBox"
    fill="currentColor"
    focusable="false"
    aria-hidden="true"
    v-html="iconSource.body"
  />
</template>
