import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { createAuthRefreshCoordinator } from './auth-session.js'

type SessionStore<Session> = {
  sessionEpoch: number
  accessToken: string | null
  refreshToken: string | null
  setSession: (session: Session) => void
  logout: () => void
}

type RetriableConfig = InternalAxiosRequestConfig & {
  _authRetried?: boolean
  _authSessionEpoch?: number
  _authRefreshToken?: string | null
}

type AuthInterceptorDependencies<Session, Store extends SessionStore<Session>> = {
  getStore: () => Store
  getApiErrorCode: (error: unknown) => string | null | undefined
  refresh: (token: string) => Promise<Session>
}

const AUTH_PATH = '/client/auth/'

function isAuthRequest(config: InternalAxiosRequestConfig): boolean {
  return Boolean(config.url?.startsWith(AUTH_PATH))
}

export function installAuthInterceptorCore<Session, Store extends SessionStore<Session>>(
  api: AxiosInstance,
  dependencies: AuthInterceptorDependencies<Session, Store>,
) {
  const { getStore, getApiErrorCode, refresh } = dependencies
  const refreshCoordinator = createAuthRefreshCoordinator(refresh)

  api.interceptors.request.use((config) => {
    const store = getStore()
    const retriable = config as RetriableConfig
    retriable._authSessionEpoch = store.sessionEpoch
    retriable._authRefreshToken = store.refreshToken
    if (store.accessToken && !isAuthRequest(config)) {
      config.headers.Authorization = `Bearer ${store.accessToken}`
    }
    return config
  })

  api.interceptors.response.use(undefined, async (error) => {
    const config = axios.isAxiosError(error) ? (error.config as RetriableConfig | undefined) : null
    const store = getStore()

    if (
      !config ||
      config._authRetried ||
      isAuthRequest(config) ||
      getApiErrorCode(error) !== 'unauthorized' ||
      !store.refreshToken
    ) {
      return Promise.reject(error)
    }

    const epoch = config._authSessionEpoch
    const token = config._authRefreshToken
    if (epoch === undefined || !token || !refreshCoordinator.isCurrent(store, epoch, token)) {
      return Promise.reject(error)
    }

    config._authRetried = true
    const refreshed = await refreshCoordinator.refreshSession(store, epoch, token)
    if (!refreshed || !refreshCoordinator.isEpochCurrent(store, epoch)) {
      return Promise.reject(error)
    }
    delete config.headers.Authorization
    return api(config)
  })
}
