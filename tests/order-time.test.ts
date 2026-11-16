import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { useOrderTime } from '@/modules/order/composables/useOrderTime'

type Schedule = { enabled: boolean; open: string | null; close: string | null }
const branch = reactive<{
  activeBranch: {
    branch_info: {
      timezone: string
      delivery_time: number
      working_hours: Record<string, Schedule> | null
      special_hours: Record<string, Schedule> | null
      intake: { mode: string }
    }
  }
}>({
  activeBranch: {
    branch_info: {
      timezone: 'Europe/Moscow',
      delivery_time: 30,
      working_hours: null,
      special_hours: null,
      intake: { mode: 'open' },
    },
  },
})

vi.mock('@/modules/branch/stores/branch.store', () => ({ useBranchStore: () => branch }))
vi.mock('@/i18n', () => ({
  intlLocale: () => 'en-US',
  t: (key: string, params?: { time: string }) =>
    key === 'order.timeSelect.asapEta' ? `≈ ${params?.time}` : key,
}))

const open = (start: string, end: string): Schedule => ({ enabled: true, open: start, close: end })
const closed: Schedule = { enabled: false, open: null, close: null }

beforeEach(() => {
  vi.useFakeTimers()
  // 10:15:30 in Moscow, Monday 16 November 2026.
  vi.setSystemTime(new Date('2026-11-16T07:15:30Z'))
  branch.activeBranch.branch_info.timezone = 'Europe/Moscow'
  branch.activeBranch.branch_info.delivery_time = 30
  branch.activeBranch.branch_info.working_hours = null
  branch.activeBranch.branch_info.special_hours = null
  branch.activeBranch.branch_info.intake.mode = 'open'
})
afterEach(() => vi.useRealTimers())

describe('useOrderTime', () => {
  it('shows exact minutes and the next three branch calendar days, including 24/7 carryover', () => {
    const result = useOrderTime(ref('delivery'))
    expect(result.days.value.map((day) => day.key)).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
    ])
    expect(result.days.value[0]?.ranges).toEqual([{ start: '10:46', end: '23:59' }])
    expect(result.days.value[1]?.ranges).toEqual([{ start: '00:00', end: '23:59' }])
    expect(result.days.value[0]?.suggestions).toEqual(['10:46', '11:00', '11:15'])
    expect(result.asapAvailable.value).toBe(true)
    expect(result.asapLabel.value).toBe('≈ 10:50')
    expect(result.isAvailable('2026-11-16T10:46:00')).toBe(true)
    expect(result.isAvailable('2026-11-16T10:45:00')).toBe(false)
    expect(result.isAvailable('2026-11-16T13:99:00')).toBe(false)
    expect(result.isAvailable('2026-11-17T00:00:00')).toBe(true)
    expect(result.fallback()).toBeNull()
    expect(result.selectedLabel('2026-11-17T00:00:00')).toBe('order.timeSelect.tomorrow, 00:00')
  })

  it('applies lead time from opening and excludes the closing minute', () => {
    branch.activeBranch.branch_info.working_hours = {
      monday: open('11:00', '12:00'),
      tuesday: closed,
      wednesday: closed,
    }
    const result = useOrderTime(ref('delivery'))
    expect(result.days.value[0]?.ranges).toEqual([{ start: '11:30', end: '11:59' }])
    expect(result.days.value[1]?.ranges).toEqual([])
    expect(result.asapAvailable.value).toBe(false)
    expect(result.fallback()).toBe('2026-11-16T11:30:00')
    expect(result.isAvailable('2026-11-16T12:00:00')).toBe(false)
  })

  it('keeps an ASAP estimate already on a ten-minute boundary', () => {
    vi.setSystemTime(new Date('2026-11-16T07:10:00Z')) // 10:10 Moscow
    const result = useOrderTime(ref('delivery'))
    expect(result.asapAvailable.value).toBe(true)
    expect(result.asapLabel.value).toBe('≈ 10:40')
  })

  it('rounds an ASAP estimate across midnight within one overnight interval', () => {
    vi.setSystemTime(new Date('2026-11-16T20:25:30Z')) // Monday 23:25:30 Moscow
    branch.activeBranch.branch_info.working_hours = {
      monday: open('22:00', '02:00'),
      tuesday: closed,
    }
    const result = useOrderTime(ref('delivery'))
    expect(result.asapAvailable.value).toBe(true)
    expect(result.asapLabel.value).toBe('≈ 00:00')
    expect(result.days.value[1]?.ranges).toEqual([{ start: '00:00', end: '01:59' }])
  })

  it('keeps the exact ASAP estimate when rounding would cross closing', () => {
    vi.setSystemTime(new Date('2026-11-16T08:25:30Z')) // Monday 11:25:30 Moscow
    branch.activeBranch.branch_info.working_hours = { monday: open('10:00', '12:00') }
    const result = useOrderTime(ref('delivery'))
    expect(result.asapAvailable.value).toBe(true)
    expect(result.asapLabel.value).toBe('≈ 11:56')
  })

  it('suggests the first exact minute followed by convenient quarter hours', () => {
    vi.setSystemTime(new Date('2026-11-16T15:10:00Z')) // 18:10 Moscow
    branch.activeBranch.branch_info.working_hours = {
      monday: open('17:00', '20:00'),
    }
    const result = useOrderTime(ref('delivery'))
    expect(result.days.value[0]?.ranges).toEqual([{ start: '18:40', end: '19:59' }])
    expect(result.days.value[0]?.suggestions).toEqual(['18:40', '18:45', '19:00'])
  })

  it('keeps an overnight carryover separate from a later opening and honors exceptions', () => {
    branch.activeBranch.branch_info.working_hours = {
      sunday: open('22:00', '02:00'),
      monday: open('18:00', '23:00'),
      tuesday: open('10:00', '14:00'),
      wednesday: closed,
    }
    branch.activeBranch.branch_info.special_hours = {
      '2026-11-17': open('12:00', '15:00'),
    }
    vi.setSystemTime(new Date('2026-11-15T22:00:00Z')) // Monday 01:00 Moscow
    const result = useOrderTime(ref('delivery'))
    expect(result.days.value[0]?.ranges).toEqual([
      { start: '01:30', end: '01:59' },
      { start: '18:30', end: '22:59' },
    ])
    expect(result.days.value[1]?.ranges).toEqual([{ start: '12:30', end: '14:59' }])
    expect(result.days.value[0]?.suggestions).toEqual(['01:30', '01:45', '18:30'])
    expect(result.asapAvailable.value).toBe(true)
    expect(result.isAvailable('2026-11-16T02:00:00')).toBe(false)
  })

  it('removes all availability while intake is paused', () => {
    branch.activeBranch.branch_info.intake.mode = 'paused'
    const result = useOrderTime(ref('delivery'))
    expect(result.days.value.every((day) => day.ranges.length === 0)).toBe(true)
    expect(result.asapAvailable.value).toBe(false)
    expect(result.isAvailable(null)).toBe(false)
    expect(result.fallback()).toBeNull()
  })
})
