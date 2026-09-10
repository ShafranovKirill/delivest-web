export const getEnv = <T = string>(key: keyof ImportMetaEnv, defaultValue?: T): T => {
  const value = import.meta.env[key]

  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new Error(`getEnv() | Environment variable ${key} is required but not defined.`)
  }

  return value as T
}

export const getCafeName = () => getEnv('VITE_CAFE_NAME', 'Cafe_name')
export const getPhoneNumber = () => getEnv('VITE_PHONE_NUMBER', '+71234567890')
export const getVkUrl = () => getEnv('VITE_VK_URL', 'https://vk.com')
export const getInstagramUrl = () => getEnv('VITE_INSTAGRAM_URL', 'https://www.instagram.com')
export const getYmapsUrl = () => getEnv('VITE_YMAPS_URL', 'https://yandex.ru')
export const getAddress = () => getEnv('VITE_ADDRESS', 'ул. Уличная, 1/23, Город')
