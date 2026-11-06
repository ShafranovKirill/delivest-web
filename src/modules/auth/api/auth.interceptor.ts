import type { AxiosInstance } from 'axios'
import { getApiErrorCode } from '@/api/errors'
import { AuthService } from './auth.service'
import { useAuthStore } from '../stores/auth.store'
import { installAuthInterceptorCore } from './auth-interceptor-core'

export function installAuthInterceptor(api: AxiosInstance) {
  installAuthInterceptorCore(api, {
    getStore: useAuthStore,
    getApiErrorCode,
    refresh: AuthService.refresh,
  })
}
