import { describe, it, expect } from 'vitest'
import { pad2, isoToDisplay, displayToIso, useCalendarViewState } from '@/modules/mba3-consultas/composables/useIsoDateInput'

describe('pad2', () => {
  it('agrega cero a la izquierda a numeros de 1 digito', () => {
    expect(pad2(3)).toBe('03')
  })
  it('deja igual a numeros de 2 digitos', () => {
    expect(pad2(12)).toBe('12')
  })
})

describe('isoToDisplay', () => {
  it('convierte YYYY-MM-DD a DD/MM/YYYY', () => {
    expect(isoToDisplay('2026-08-31')).toBe('31/08/2026')
  })
  it('vacio para string vacio', () => {
    expect(isoToDisplay('')).toBe('')
  })
  it('vacio para formato invalido', () => {
    expect(isoToDisplay('31/08/2026')).toBe('')
  })
})

describe('displayToIso', () => {
  it('convierte DD/MM/YYYY a YYYY-MM-DD', () => {
    expect(displayToIso('31/08/2026')).toBe('2026-08-31')
  })
  it('recorta espacios', () => {
    expect(displayToIso('  01/01/2026  ')).toBe('2026-01-01')
  })
  it('null para formato invalido', () => {
    expect(displayToIso('2026-08-31')).toBeNull()
  })
  it('null para mes fuera de rango', () => {
    expect(displayToIso('01/13/2026')).toBeNull()
  })
  it('null para mes 0', () => {
    expect(displayToIso('01/00/2026')).toBeNull()
  })
  it('null para dia invalido en un mes de 30 dias', () => {
    expect(displayToIso('31/04/2026')).toBeNull()
  })
  it('acepta 29 de febrero en año bisiesto', () => {
    expect(displayToIso('29/02/2024')).toBe('2024-02-29')
  })
  it('null para 29 de febrero en año no bisiesto', () => {
    expect(displayToIso('29/02/2026')).toBeNull()
  })
})

describe('useCalendarViewState', () => {
  it('inicializa con el mes/año actual', () => {
    const { viewYear, viewMonth } = useCalendarViewState()
    const now = new Date()
    expect(viewYear.value).toBe(now.getFullYear())
    expect(viewMonth.value).toBe(now.getMonth())
  })

  it('syncViewToValue mueve la vista al mes/año del ISO dado', () => {
    const { viewYear, viewMonth, syncViewToValue } = useCalendarViewState()
    syncViewToValue('2026-03-15')
    expect(viewYear.value).toBe(2026)
    expect(viewMonth.value).toBe(2) // marzo = index 2
  })

  it('syncViewToValue con ISO invalido/vacio vuelve al mes/año actual', () => {
    const { viewYear, viewMonth, syncViewToValue } = useCalendarViewState()
    syncViewToValue('2026-03-15')
    syncViewToValue('')
    const now = new Date()
    expect(viewYear.value).toBe(now.getFullYear())
    expect(viewMonth.value).toBe(now.getMonth())
  })
})
