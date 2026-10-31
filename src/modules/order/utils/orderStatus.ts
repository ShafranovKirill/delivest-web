import type { ActiveOrder, OrderStatus } from '../api/order.service'
import { intlLocale, t } from '@/i18n'

type FulfillmentType = ActiveOrder['fulfillment_type']

const STATUS_ICONS: Record<OrderStatus, string> = {
  created: 'pi-clock',
  accepted: 'pi-check-circle',
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

type StatusSource = Pick<ActiveOrder, 'status' | 'payment_method' | 'awaiting_payment'>

export function orderStatusLabel(order: StatusSource): string {
  if (order.awaiting_payment) return t('order.status.awaitingPayment')
  if (order.payment_method === 'online') {
    if (order.status === 'created') return t('order.status.paidCreated')
    if (order.status === 'accepted') return t('order.status.paidAccepted')
  }
  return statusLabel(order.status)
}

export function orderStatusIcon(order: StatusSource): string {
  return order.awaiting_payment ? 'pi-credit-card' : statusIcon(order.status)
}

export function fulfillmentLabel(type: FulfillmentType): string {
  return t(`order.fulfillment.${type}`)
}

export function paymentLabel(method: ActiveOrder['payment_method']): string {
  return t(`order.payment.${method}`)
}

const STEPS: Record<FulfillmentType, OrderStatus[]> = {
  delivery: ['created', 'accepted', 'preparing', 'delivering'],
  pickup: ['created', 'accepted', 'preparing', 'ready'],
  dine_in: ['created', 'accepted', 'preparing', 'ready'],
}

export function orderSteps(order: ActiveOrder): OrderStatus[] {
  return STEPS[order.fulfillment_type]
}

const RANK: Record<OrderStatus, number> = {
  created: 0,
  accepted: 1,
  preparing: 2,
  ready: 3,
  delivering: 4,
  completed: 5,
  cancelled: 5,
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
