const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(zone: string): Intl.DateTimeFormat {
  let instance = formatters.get(zone)

  if (!instance) {
    instance = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    formatters.set(zone, instance)
  }

  return instance
}

/**
 * Builds a Date whose local getters (getFullYear, getDay, getHours, ...) match
 * the wall clock of `zone`, so the schedule is calculated in the branch
 * timezone instead of the visitor's device timezone.
 */
export function zonedDate(zone: string | null | undefined, at: Date = new Date()): Date {
  if (!zone) return new Date(at.getTime())

  try {
    const parts = formatter(zone).formatToParts(at)
    const read = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value ?? 0)

    return new Date(
      read('year'),
      read('month') - 1,
      read('day'),
      read('hour'),
      read('minute'),
      read('second'),
    )
  } catch {
    return new Date(at.getTime())
  }
}
