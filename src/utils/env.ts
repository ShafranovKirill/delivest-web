declare global {
  interface Window {
    _env?: Record<string, string>
  }
}

export const getEnv = <T = string>(key: keyof ImportMetaEnv, defaultValue?: T): T => {
  const value = window._env?.[key] ?? import.meta.env[key]

  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new Error(`getEnv() | Environment variable ${key} is required but not defined.`)
  }

  return value as T
}

export const getSiteDescription = () =>
  getEnv('VITE_SITE_DESCRIPTION', 'Описание сайта по умолчанию')
export const getApiBaseUrl = () =>
  getEnv('VITE_API_BASE_URL', 'https://delivest-server.shafranov.tech2')
export const getCafeName = () => getEnv('VITE_CAFE_NAME', 'Cafe_name')
export const getYandexMapsApiKey = () => getEnv('VITE_YANDEX_MAPS_API_KEY', '')
