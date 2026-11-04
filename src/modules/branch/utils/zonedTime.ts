const formatters = new Map<string, Intl.DateTimeFormat>()

/**
 * A wall-clock value in a branch timezone.
 *
 * It is deliberately not a `Date`: a local `Date` is interpreted in the
 * visitor's timezone, so an hour that does not exist there during a DST change
 * (for example 02:30) silently moves. Schedule arithmetic on these fields is
 * plain calendar math and does not depend on the device at all.
 */
export interface WallClock {
  year: number
  /** 1-12 */
  month: number
  day: number
  hour: number
  minute: number
  second: number
  /** 0 is Sunday */
  weekday: number
}

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

function clockFromUtcDate(date: Date): WallClock {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    weekday: date.getUTCDay(),
  }
}

function clockFromLocalDate(date: Date): WallClock {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    weekday: date.getDay(),
  }
}

/** Reads the branch wall clock for an absolute moment. */
export function wallClock(zone: string | null | undefined, at: Date = new Date()): WallClock {
  if (!zone) return clockFromLocalDate(at)

  try {
    const parts = formatter(zone).formatToParts(at)
    const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)
    const year = read('year')
    const month = read('month')
    const day = read('day')

    return {
      year,
      month,
      day,
      hour: read('hour'),
      minute: read('minute'),
      second: read('second'),
      weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
    }
  } catch {
    return clockFromLocalDate(at)
  }
}

/** Converts branch wall time to an instant. Used only when an API needs UTC. */
export function wallClockToUtc(clock: WallClock, zone: string | null | undefined): Date {
  if (!zone) return new Date(clockUtcMillis(clock))

  const target = clockUtcMillis(clock)
  let guess = target

  for (let attempt = 0; attempt < 3; attempt++) {
    const actual = clockUtcMillis(wallClock(zone, new Date(guess)))
    const difference = target - actual
    if (difference === 0) break
    guess += difference
  }

  return new Date(guess)
}

function clockUtcMillis(clock: WallClock): number {
  return Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute, clock.second)
}

/** Minutes since the Unix epoch for wall-clock comparisons. */
export function clockMinutes(clock: WallClock): number {
  return Math.floor(clockUtcMillis(clock) / 60_000)
}

export function fromClockMinutes(minutes: number): WallClock {
  return clockFromUtcDate(new Date(minutes * 60_000))
}

export function addMinutes(clock: WallClock, minutes: number): WallClock {
  return fromClockMinutes(clockMinutes(clock) + minutes)
}

export function addDays(clock: WallClock, days: number): WallClock {
  return fromClockMinutes(clockMinutes(clock) + days * 24 * 60)
}

export function atMinutes(clock: WallClock, minutes: number): WallClock {
  const start = fromClockMinutes(Math.floor(clockMinutes(clock) / 1440) * 1440)
  return addMinutes(start, minutes)
}

export function startOfDay(clock: WallClock): WallClock {
  return atMinutes(clock, 0)
}

export function compare(a: WallClock, b: WallClock): number {
  return clockMinutes(a) - clockMinutes(b)
}

export function sameDay(a: WallClock, b: WallClock): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
}

export function isoDate(clock: WallClock): string {
  const month = String(clock.month).padStart(2, '0')
  const day = String(clock.day).padStart(2, '0')
  return `${clock.year}-${month}-${day}`
}

export function slotValue(clock: WallClock): string {
  const hour = String(clock.hour).padStart(2, '0')
  const minute = String(clock.minute).padStart(2, '0')
  return `${isoDate(clock)}T${hour}:${minute}:00`
}

/** Formats branch wall time without letting the device timezone move it. */
export function formatClock(
  clock: WallClock,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Date(clockUtcMillis(clock)).toLocaleString(locale, {
    ...options,
    timeZone: 'UTC',
  })
}

export function weekdayKey(clock: WallClock): string | undefined {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    clock.weekday
  ]
}
