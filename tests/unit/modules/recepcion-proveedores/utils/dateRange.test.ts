import { describe, it, expect } from 'vitest'
import { toLocalDayBoundIso, todayLocalDateString, daysAgoLocalDateString } from '@/modules/recepcion-proveedores/utils/dateRange'

describe('toLocalDayBoundIso', () => {
  it('converts a date-only string to the start of the local day', () => {
    const iso = toLocalDayBoundIso('2026-09-09', false)
    const d = new Date(iso)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(8)
    expect(d.getDate()).toBe(9)
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
    expect(d.getMilliseconds()).toBe(0)
  })

  it('converts a date-only string to the end of the local day', () => {
    const iso = toLocalDayBoundIso('2026-09-09', true)
    const d = new Date(iso)
    expect(d.getHours()).toBe(23)
    expect(d.getMinutes()).toBe(59)
    expect(d.getSeconds()).toBe(59)
    expect(d.getMilliseconds()).toBe(999)
  })

  it('returns the input unchanged when it is not a plain date string', () => {
    expect(toLocalDayBoundIso('not-a-date', false)).toBe('not-a-date')
  })
})

describe('todayLocalDateString / daysAgoLocalDateString', () => {
  it('returns dates in YYYY-MM-DD format', () => {
    expect(todayLocalDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(daysAgoLocalDateString(4)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('daysAgoLocalDateString(0) matches todayLocalDateString()', () => {
    expect(daysAgoLocalDateString(0)).toBe(todayLocalDateString())
  })

  it('daysAgoLocalDateString(4) is earlier than today', () => {
    expect(daysAgoLocalDateString(4) <= todayLocalDateString()).toBe(true)
  })
})
