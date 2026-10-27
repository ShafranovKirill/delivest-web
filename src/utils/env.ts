declare global {
  interface Window {
    _env?: Record<string, string>
  }
}

export const getEnv = <T = string>(key: string, defaultValue?: T): T => {
  const value = window._env?.[key] ?? (import.meta.env[key] as string)

  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new Error(`getEnv() | Environment variable ${key} is required but not defined.`)
  }

  return value as T
}

export const getApiBaseUrl = () =>
  getEnv('VITE_API_BASE_URL', 'https://delivest-server.shafranov.tech')
