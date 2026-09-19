import { beforeEach, describe, expect, it, vi } from 'vitest'
import { extraerErroresCampo, extraerMensajeError, tesoreriaService } from '@/modules/tesoreria/services/tesoreriaService'
import type { CrearDepositoPayload } from '@/modules/tesoreria/types/tesoreria.types'

const http = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('@/lib/http', () => ({ tesoreriaHttp: http }))

describe('contrato de depósitos y ProblemDetails', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    { response: { status: 409, data: { detail: 'El comprobante 12345678 ya existe' } } },
    { response: { status: 400, data: { detail: 'La papeleta ya existe' } } },
    { response: { data: { status: 409, errors: {}, detail: 'Referencia duplicada' } } }
  ])('asocia conflictos sin errors al comprobante', error => {
    expect(extraerErroresCampo(error)).toEqual({ NumeroComprobante: error.response.data.detail })
  })

  it('conserva errores explícitos y normaliza el nombre del comprobante', () => {
    expect(extraerErroresCampo({ response: { status: 409, data: {
      detail: 'Comprobante duplicado',
      errors: { 'request.numeroComprobante': ['Error específico'], MontoDepositado: 'Monto inválido', Otro: [] }
    } } })).toEqual({ NumeroComprobante: 'Error específico', MontoDepositado: 'Monto inválido' })
  })

  it.each([null, undefined, {}, new Error('Sin conexión'), { response: { status: 500, data: { detail: 'Error interno' } } }])(
    'no inventa un error de campo sin evidencia', error => expect(extraerErroresCampo(error)).toBeNull()
  )

  it('prioriza el detalle útil sobre el título HTTP genérico', () => {
    expect(extraerMensajeError({ response: { data: {
      title: 'Conflict', detail: 'La papeleta ya existe', correlationId: 'ref-prueba'
    } } })).toBe('La papeleta ya existe (Ref: ref-prueba)')
  })

  it('envía el ID del catálogo y el archivo en multipart, sin alterar el contrato', async () => {
    const payload: CrearDepositoPayload = {
      almacenId: 47, codigoAlmacen: 'T047', fechaCierreCaja: '2026-09-18', fechaDepositoBanco: '2026-09-19',
      cuentaFinancieraId: 9, numeroComprobante: '12345678', montoDepositado: 0.2,
      moneda: 'USD', tipoDeposito: 'dtCash', responsable: 'Cajero de prueba', esSobrante: false,
      comprobante: new File(['test'], 'recibo.pdf', { type: 'application/pdf' })
    }
    http.post.mockResolvedValue({ data: { id: 1 } })
    await tesoreriaService.crearDeposito(payload)
    const form = http.post.mock.calls[0][1] as FormData
    expect(http.post.mock.calls[0][0]).toBe('/depositos')
    expect(form.get('AlmacenId')).toBe('47')
    expect(form.get('CodigoAlmacen')).toBe('T047')
    expect(form.get('MontoDepositado')).toBe('0.2')
    expect(form.get('Comprobante')).toBeInstanceOf(File)
  })
})
