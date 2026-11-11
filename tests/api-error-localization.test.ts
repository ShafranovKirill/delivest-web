import axios from 'axios'
import { afterEach, describe, expect, it } from 'vitest'
import { getApiErrorMessage } from '@/api/errors'
import { i18n } from '@/i18n'
import { ru } from '@/i18n/locales/ru'

const originalLocale = i18n.global.locale.value

afterEach(() => {
  i18n.global.locale.value = originalLocale
})

describe('API error messages in Russian', () => {
  it('uses a localized fallback for internal errors, including a caller-specific fallback', () => {
    i18n.global.locale.value = 'ru'

    expect(getApiErrorMessage(new Error('Cart context changed'))).toBe(ru.errors.fallback)
    expect(getApiErrorMessage(new Error('[OrderStore] cart_id is missing'), ru.order.failed)).toBe(
      ru.order.failed,
    )
  })

  it('keeps translated API codes and the offline message', () => {
    i18n.global.locale.value = 'ru'
    const knownCode = new axios.AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        data: { error: 'cart_is_empty' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
      },
    )
    const offline = new axios.AxiosError('Network Error', 'ERR_NETWORK')

    expect(getApiErrorMessage(knownCode)).toBe(ru.errors.codes.cart_is_empty)
    expect(getApiErrorMessage(offline)).toBe(ru.errors.offline)
  })
})
