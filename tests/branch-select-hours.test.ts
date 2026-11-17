import { describe, expect, it } from 'vitest'
import type { Branch } from '@/modules/branch/api/branch.service'
import { todayHours } from '@/modules/branch/composables/useBranchStatus'

type Schedule = { enabled: boolean; open: string | null; close: string | null }

function branch(
  workingHours: Record<string, Schedule> | null,
  specialHours: Record<string, Schedule> | null = null,
): Branch {
  return {
    branch_info: {
      timezone: 'Europe/Moscow',
      working_hours: workingHours,
      special_hours: specialHours,
    },
  } as Branch
}

const at = new Date('2026-11-16T22:30:00Z') // Tuesday in Moscow

describe('branch selection today hours', () => {
  it('uses the branch timezone and special hours before weekly hours', () => {
    const weekly = {
      monday: { enabled: true, open: '08:00', close: '18:00' },
      tuesday: { enabled: true, open: '10:00', close: '22:00' },
    }
    expect(todayHours(branch(weekly), at)).toEqual({
      kind: 'range',
      open: '10:00',
      close: '22:00',
    })
    expect(
      todayHours(branch(weekly, { '2026-11-17': { enabled: false, open: null, close: null } }), at),
    ).toEqual({ kind: 'dayOff' })
  })

  it('does not invent hours when the schedule is absent', () => {
    expect(todayHours(branch(null), at)).toEqual({ kind: 'notSet' })
    expect(
      todayHours(branch({ monday: { enabled: true, open: '08:00', close: '18:00' } }), at),
    ).toEqual({ kind: 'notSet' })
  })

  it('handles all-day and overnight schedules', () => {
    expect(todayHours(branch({ tuesday: { enabled: true, open: null, close: null } }), at)).toEqual(
      {
        kind: 'allDay',
      },
    )
    expect(
      todayHours(branch({ tuesday: { enabled: true, open: '20:00', close: '02:00' } }), at),
    ).toEqual({ kind: 'overnight', open: '20:00', close: '02:00' })
    expect(
      todayHours(branch({ tuesday: { enabled: true, open: null, close: '10:00' } }), at),
    ).toEqual({ kind: 'range', open: '00:00', close: '10:00' })
  })
})
