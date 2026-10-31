import { useI18n } from 'vue-i18n'
import { intlLocale } from '@/i18n'

export function useStarsLabel() {
  const { t } = useI18n()

  return (count: number) => {
    const rule = new Intl.PluralRules(intlLocale()).select(count)
    return t(`loyalty.stars.${rule}`, { count })
  }
}
