import type { ActiveOrder, OrderStatus } from '../api/order.service'

type FulfillmentType = ActiveOrder['fulfillment_type']

export const STATUS_INFO: Record<OrderStatus, { label: string; icon: string }> = {
  created: { label: 'Принят', icon: 'pi-check-circle' },
  preparing: { label: 'Готовится', icon: 'pi-hourglass' },
  ready: { label: 'Готов', icon: 'pi-shopping-bag' },
  delivering: { label: 'В пути', icon: 'pi-truck' },
  completed: { label: 'Выполнен', icon: 'pi-verified' },
  cancelled: { label: 'Отменён', icon: 'pi-times-circle' },
}

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  delivery: 'Доставка',
  pickup: 'Самовывоз',
  dine_in: 'В заведении',
}

export const PAYMENT_LABELS: Record<ActiveOrder['payment_method'], string> = {
  cash: 'Наличными',
  card_offline: 'Картой при получении',
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
  return new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function formatPrice(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`
}
