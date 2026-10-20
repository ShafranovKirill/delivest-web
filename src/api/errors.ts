import axios from 'axios'
import type { components } from '@/api/types'
import { i18n, t } from '@/i18n'

export type ApiErrorResponse = components['schemas']['ErrorResponse']
export type ApiErrorCode = ApiErrorResponse['error']

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

export function getApiErrorMessage(error: unknown, fallback?: string): string {
  const fallbackText = fallback ?? t('errors.fallback')

  if (axios.isAxiosError(error)) {
    if (!error.response) return t('errors.offline')

    const code = getApiErrorCode(error)
    if (code && i18n.global.te(`errors.codes.${code}`)) return t(`errors.codes.${code}`)
    return fallbackText
  }

  return error instanceof Error && error.message ? error.message : fallbackText
}
