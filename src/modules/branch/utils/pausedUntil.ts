export function formatPausedUntil(value: string, locale: string, zone?: string | null): string {
  return new Date(value).toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: zone || undefined,
    timeZoneName: 'short',
  })
}
