import { defineStore } from 'pinia'
import { computed } from 'vue'
import { LOCALES, applyLocale, currentLocale, type Locale } from '@/i18n'

export const useLocaleStore = defineStore('locale', () => {
  const locale = computed<Locale>({
    get: currentLocale,
    set: applyLocale,
  })

  function toggle() {
    locale.value = LOCALES[(LOCALES.indexOf(locale.value) + 1) % LOCALES.length]!
  }

  return { locale, toggle }
})
