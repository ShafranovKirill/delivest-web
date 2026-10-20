import type { ActiveOrder, OrderStatus } from '../api/order.service'
import { intlLocale, t } from '@/i18n'

type FulfillmentType = ActiveOrder['fulfillment_type']

const STATUS_ICONS: Record<OrderStatus, string> = {
  created: 'pi-check-circle',
  preparing: 'pi-hourglass',
  ready: 'pi-shopping-bag',
  delivering: 'pi-truck',
  completed: 'pi-verified',
  cancelled: 'pi-times-circle',
}

export function statusIcon(status: OrderStatus): string {
  return STATUS_ICONS[status]
}

export function statusLabel(status: OrderStatus): string {
  return t(`order.status.${status}`)
}

export function fulfillmentLabel(type: FulfillmentType): string {
  return t(`order.fulfillment.${type}`)
}

export function paymentLabel(method: ActiveOrder['payment_method']): string {
  return t(`order.payment.${method}`)
}

const STEPS: Record<FulfillmentType, OrderStatus[]> = {
  delivery: ['created', 'preparing', 'delivering'],
  pickup: ['created', 'preparing', 'ready'],
  dine_in: ['created', 'preparing', 'ready'],
}

export function orderSteps(order: ActiveOrder): OrderStatus[] {
  return STEPS[order.fulfillment_type]
}

const RANK: Record<OrderStatus, number> = {
  created: 0,
  preparing: 1,
  ready: 2,
  delivering: 3,
  completed: 4,
  cancelled: 4,
}

export function currentStep(order: ActiveOrder): number {
  return orderSteps(order).reduce(
    (current, step, index) => (RANK[step] <= RANK[order.status] ? index : current),
    0,
  )
}

export function formatTime(value?: string | null): string | null {
  if (!value) return null
  return new Date(value).toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit' })
}

export function formatPrice(value: number): string {
  return `${value.toLocaleString(intlLocale())} ₽`
}
