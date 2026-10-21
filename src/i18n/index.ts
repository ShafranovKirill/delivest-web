import { createI18n } from 'vue-i18n'
import { ru } from './locales/ru'
import { en } from './locales/en'

export type Locale = 'ru' | 'en'

export const LOCALES: Locale[] = ['ru', 'en']
export const LOCALE_NAMES: Record<Locale, string> = { ru: 'Русский', en: 'English' }
export const LOCALE_STORAGE_KEY = 'delivest-locale'

function storedLocale(): Locale {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY)
    return LOCALES.includes(value as Locale) ? (value as Locale) : 'ru'
  } catch {
    return 'ru'
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: storedLocale(),
  fallbackLocale: 'ru',
  messages: { ru, en },
})

export function currentLocale(): Locale {
  return i18n.global.locale.value as Locale
}

export function applyLocale(locale: Locale) {
  i18n.global.locale.value = locale
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    return
  }
}

export const t = i18n.global.t

export function intlLocale(): string {
  return currentLocale() === 'en' ? 'en-GB' : 'ru-RU'
}
