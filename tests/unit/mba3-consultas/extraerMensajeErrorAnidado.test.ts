import { describe, it, expect } from 'vitest'
import { extraerMensajeErrorAnidado } from '@/modules/mba3-consultas/utils/httpErrors'

describe('extraerMensajeErrorAnidado', () => {
  it('usa detail.message cuando detail es un objeto', () => {
    const e = { response: { status: 400, data: { error: 'x', detail: { message: 'del objeto' } } } }
    expect(extraerMensajeErrorAnidado(e)).toEqual({ status: 400, errorCode: 'x', msg: 'del objeto' })
  })

  it('usa detail directamente cuando es un string', () => {
    const e = { response: { status: 400, data: { error: 'y', detail: 'texto plano' } } }
    expect(extraerMensajeErrorAnidado(e)).toEqual({ status: 400, errorCode: 'y', msg: 'texto plano' })
  })

  it('cae a data.message si no hay detail', () => {
    const e = { response: { status: 500, data: { message: 'del data' } } }
    expect(extraerMensajeErrorAnidado(e)).toEqual({ status: 500, errorCode: undefined, msg: 'del data' })
  })

  it('cae a e.message si no hay response', () => {
    const e = { message: 'error generico' }
    expect(extraerMensajeErrorAnidado(e)).toEqual({ status: undefined, errorCode: undefined, msg: 'error generico' })
  })
})
