import { expect, it } from 'vitest'
import { formatPausedUntil } from '@/modules/branch/utils/pausedUntil'

it('uses the branch timezone across midnight and the spring DST jump', () => {
  const instant = '2026-03-29T01:30:00Z'
  const berlin = formatPausedUntil(instant, 'en-US', 'Europe/Berlin')
  const newYork = formatPausedUntil(instant, 'en-US', 'America/New_York')
  expect(berlin).toMatch(/Mar 29.*03:30/)
  expect(newYork).toMatch(/Mar 28.*09:30/)
})

it('shows the offset during the repeated fall DST hour', () => {
  const first = formatPausedUntil('2026-10-25T00:30:00Z', 'en-US', 'Europe/Berlin')
  const second = formatPausedUntil('2026-10-25T01:30:00Z', 'en-US', 'Europe/Berlin')
  expect(first).toContain('02:30')
  expect(second).toContain('02:30')
  expect(first).not.toBe(second)
})
