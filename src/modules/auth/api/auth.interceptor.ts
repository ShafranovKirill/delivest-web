import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { getApiErrorCode } from '@/api/errors'
import { AuthService } from './auth.service'
import { useAuthStore } from '../stores/auth.store'

type RetriableConfig = InternalAxiosRequestConfig & { _authRetried?: boolean }

const AUTH_PATH = '/client/auth/'

let refreshing: Promise<void> | null = null

function refreshSession(store: ReturnType<typeof useAuthStore>): Promise<void> {
  refreshing ??= AuthService.refresh(store.refreshToken ?? '')
    .then(store.setSession)
    .catch(() => store.logout())
    .finally(() => {
      refreshing = null
    })

  return refreshing
}

function isAuthRequest(config: InternalAxiosRequestConfig): boolean {
  return Boolean(config.url?.startsWith(AUTH_PATH))
}

export function installAuthInterceptor(api: AxiosInstance) {
  api.interceptors.request.use((config) => {
    const store = useAuthStore()
    if (store.accessToken && !isAuthRequest(config)) {
      config.headers.Authorization = `Bearer ${store.accessToken}`
    }
    return config
  })

  api.interceptors.response.use(undefined, async (error) => {
    const config = axios.isAxiosError(error) ? (error.config as RetriableConfig | undefined) : null
    const store = useAuthStore()

    if (
      !config ||
      config._authRetried ||
      isAuthRequest(config) ||
      getApiErrorCode(error) !== 'unauthorized' ||
      !store.refreshToken
    ) {
      return Promise.reject(error)
    }

    config._authRetried = true
    await refreshSession(store)
    delete config.headers.Authorization
    return api(config)
  })
}
