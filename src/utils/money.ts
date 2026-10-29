import { intlLocale } from '@/i18n'

export function formatPrice(kopecks?: number | null): string {
  const amount = kopecks ?? 0
  const digits = amount % 100 === 0 ? 0 : 2
  const rubles = (amount / 100).toLocaleString(intlLocale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  return `${rubles} ₽`
}
