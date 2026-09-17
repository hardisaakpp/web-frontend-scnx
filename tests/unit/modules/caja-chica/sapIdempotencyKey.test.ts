import { describe, it, expect } from 'vitest'
import {
  buildLiquidacionSapId,
  SAP_IDEMPOTENCY_MAX_LENGTH,
  SAP_IDEMPOTENCY_PREFIX
} from '@/modules/caja-chica/utils/sapIdempotencyKey'

describe('buildLiquidacionSapId', () => {
  it('arma la clave con el prefijo del módulo y el id de la liquidación', () => {
    expect(buildLiquidacionSapId(512)).toBe('cajachica-liquidacion-512')
    expect(buildLiquidacionSapId(512).startsWith(`${SAP_IDEMPOTENCY_PREFIX}-`)).toBe(true)
  })

  it('es estable: la misma liquidación produce siempre la misma clave', () => {
    expect(buildLiquidacionSapId(9001)).toBe(buildLiquidacionSapId(9001))
  })

  it('cumple el formato que valida el middleware (letras, dígitos y guion, máximo 60)', () => {
    const key = buildLiquidacionSapId(2147483647)
    expect(key).toMatch(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
    expect(key.length).toBeLessThanOrEqual(SAP_IDEMPOTENCY_MAX_LENGTH)
  })

  it('rechaza ids que no identifican una liquidación persistida', () => {
    expect(() => buildLiquidacionSapId(0)).toThrow()
    expect(() => buildLiquidacionSapId(-3)).toThrow()
    expect(() => buildLiquidacionSapId(1.5)).toThrow()
    expect(() => buildLiquidacionSapId(Number.NaN)).toThrow()
  })
})
