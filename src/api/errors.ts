import axios from 'axios'
import type { components } from '@/api/types'

export type ApiErrorResponse = components['schemas']['ErrorResponse']
export type ApiErrorCode = ApiErrorResponse['error']

const MESSAGES: Record<ApiErrorCode, string> = {
  bad_request: 'Некорректный запрос',
  branch_id_required: 'Не выбран филиал',
  branch_not_found: 'Филиал недоступен',
  cart_not_found: 'Корзина не найдена. Обновите страницу',
  cart_is_empty: 'Ваша корзина пуста',
  cart_already_ordered: 'Этот заказ уже оформлен',
  cart_branch_mismatch: 'Корзина относится к другому филиалу. Обновите страницу',
  product_unavailable: 'Товар сейчас недоступен',
  client_blocked: 'Не удалось оформить заказ. Свяжитесь с нами по телефону',
  quantity_limit_exceeded: 'Достигнуто максимальное количество товара',
  item_not_found: 'Товар не найден в корзине',
  validation_failed: 'Проверьте правильность заполнения полей',
  order_failed: 'Не удалось оформить заказ. Попробуйте ещё раз',
  too_many_requests: 'Слишком много запросов. Подождите минуту и попробуйте снова',
  internal_error: 'Ошибка сервера. Попробуйте позже',
}

const FALLBACK = 'Произошла ошибка. Попробуйте ещё раз'

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as ApiErrorResponse).error === 'string'
  )
}

export function getApiErrorCode(error: unknown): ApiErrorCode | null {
  if (axios.isAxiosError(error) && isApiErrorResponse(error.response?.data)) {
    return error.response.data.error
  }
  return null
}

export function getApiErrorMessage(error: unknown, fallback: string = FALLBACK): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Нет связи с сервером. Проверьте интернет'

    const code = getApiErrorCode(error)
    if (code && code in MESSAGES) return MESSAGES[code]
    return fallback
  }

  return error instanceof Error && error.message ? error.message : fallback
}
