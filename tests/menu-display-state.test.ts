import { describe, expect, it } from 'vitest'
import { menuDisplayState } from '../src/modules/menu/utils/menuDisplayState'

describe('menu display during requests', () => {
  it('shows loading, retryable error, and empty results on first request', () => {
    expect(menuDisplayState(false, true, false, 0)).toBe('loading')
    expect(menuDisplayState(false, false, true, 0)).toBe('error')
    expect(menuDisplayState(true, false, false, 0)).toBe('empty')
  })
  it('keeps existing cards on a same-menu background fetch or error', () => {
    expect(menuDisplayState(true, true, false, 3)).toBe('content')
    expect(menuDisplayState(true, false, true, 3)).toBe('content')
  })
})
