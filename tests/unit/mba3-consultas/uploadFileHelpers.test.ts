import { describe, it, expect } from 'vitest'
import {
  esResultadoInmediatoUpload,
  esAsyncStorageUnavailable,
  extraerNumeroPedidoDeRespuesta,
  construirMensajeDetalleValidacionSap,
  filtrarErroresSAP,
  determinarToastExito,
  determinarToastReintento,
  debeGuardarArchivoParaReintento,
  extraerCodigosDeErrorInfo,
  construirMensajeToastError,
} from '@/modules/mba3-consultas/composables/useFileUpload'

describe('esResultadoInmediatoUpload', () => {
  it('true cuando fallback=sync', () => {
    expect(esResultadoInmediatoUpload({ fallback: 'sync' })).toBe(true)
  })
  it('true cuando async=false', () => {
    expect(esResultadoInmediatoUpload({ async: false, process_id: 'x' })).toBe(true)
  })
  it('true cuando process_id es null', () => {
    expect(esResultadoInmediatoUpload({ process_id: null })).toBe(true)
  })
  it('true cuando process_id es string vacío', () => {
    expect(esResultadoInmediatoUpload({ process_id: '' })).toBe(true)
  })
  it('false cuando hay process_id real y async no es false', () => {
    expect(esResultadoInmediatoUpload({ process_id: 'job-123', async: true })).toBe(false)
  })
})

describe('esAsyncStorageUnavailable', () => {
  it('true con 503 + storage_required', () => {
    const err = { response: { status: 503, data: { error: 'storage_required' } } }
    expect(esAsyncStorageUnavailable(err)).toBe(true)
  })
  it('true con 503 + celery_unavailable en detail.error', () => {
    const err = { response: { status: 503, data: { detail: { error: 'celery_unavailable' } } } }
    expect(esAsyncStorageUnavailable(err)).toBe(true)
  })
  it('false con 503 pero otro error_code', () => {
    const err = { response: { status: 503, data: { error: 'otro_error' } } }
    expect(esAsyncStorageUnavailable(err)).toBe(false)
  })
  it('false con status distinto de 503', () => {
    const err = { response: { status: 500, data: { error: 'storage_required' } } }
    expect(esAsyncStorageUnavailable(err)).toBe(false)
  })
})

describe('extraerNumeroPedidoDeRespuesta', () => {
  it('desde la raíz', () => {
    expect(extraerNumeroPedidoDeRespuesta({ numero_pedido: 'PED-1' })).toBe('PED-1')
  })
  it('desde resultado.numero_pedido', () => {
    expect(extraerNumeroPedidoDeRespuesta({ resultado: { numero_pedido: 'PED-2' } })).toBe('PED-2')
  })
  it('desde result.numero_pedido', () => {
    expect(extraerNumeroPedidoDeRespuesta({ result: { numero_pedido: 'PED-3' } })).toBe('PED-3')
  })
  it('undefined si no aparece en ningún lado', () => {
    expect(extraerNumeroPedidoDeRespuesta({})).toBeUndefined()
  })
})

describe('construirMensajeDetalleValidacionSap', () => {
  it('sin validacion_sap solo muestra numero/articulos/distribuciones', () => {
    const msg = construirMensajeDetalleValidacionSap('PED-1', { articulos_cargados: 5, distribuciones_cargadas: 2 } as any)
    expect(msg).toBe('Número de pedido: PED-1\nArtículos: 5\nDistribuciones: 2')
  })
  it('usa N/A cuando no hay numeroPedido', () => {
    const msg = construirMensajeDetalleValidacionSap(undefined, { articulos_cargados: 1, distribuciones_cargadas: 1 } as any)
    expect(msg).toContain('Número de pedido: N/A')
  })
  it('incluye codigos no encontrados como array, con truncado a 5 + "y N más"', () => {
    const response = {
      articulos_cargados: 1, distribuciones_cargadas: 1,
      validacion_sap: { validos: 2, total_codigos: 8, no_encontrados: ['A', 'B', 'C', 'D', 'E', 'F'] }
    } as any
    const msg = construirMensajeDetalleValidacionSap('PED-1', response)
    expect(msg).toContain('No encontrados en SAP (6): A, B, C, D, E y 1 más')
  })
  it('incluye conteo simple cuando no_encontrados es numero legacy', () => {
    const response = { articulos_cargados: 1, distribuciones_cargadas: 1, validacion_sap: { validos: 1, total_codigos: 5, total_no_encontrados: 4 } } as any
    const msg = construirMensajeDetalleValidacionSap('PED-1', response)
    expect(msg).toContain('No encontrados en SAP: 4')
  })
  it('incluye errores y advertencias cuando existen', () => {
    const response = {
      articulos_cargados: 1, distribuciones_cargadas: 1,
      validacion_sap: { validos: 1, total_codigos: 1, errores: ['e1'], warnings: ['w1', 'w2'] }
    } as any
    const msg = construirMensajeDetalleValidacionSap('PED-1', response)
    expect(msg).toContain('Errores (1): e1')
    expect(msg).toContain('Advertencias (2): w1, w2')
  })
})

describe('filtrarErroresSAP', () => {
  it('incluye strings que mencionan sap o no existe', () => {
    const response = { errores: ['algo de SAP', 'no existe el producto', 'otro error cualquiera'] } as any
    expect(filtrarErroresSAP(response)).toEqual(['algo de SAP', 'no existe el producto'])
  })
  it('incluye objetos con campo=CodigoProducto', () => {
    const response = { errores: [{ campo: 'CodigoProducto', mensaje: 'x' }, { campo: 'Otro', mensaje: 'y' }] } as any
    expect(filtrarErroresSAP(response)).toEqual([{ campo: 'CodigoProducto', mensaje: 'x' }])
  })
  it('array vacío cuando no hay errores', () => {
    expect(filtrarErroresSAP({} as any)).toEqual([])
  })
})

describe('determinarToastExito', () => {
  it('success sin errores SAP -> success', () => {
    const response = { status: 'success' } as any
    expect(determinarToastExito(response, [])).toEqual({ level: 'success', title: 'Plantilla procesada exitosamente' })
  })
  it('success con erroresSAP -> warning', () => {
    const response = { status: 'success' } as any
    expect(determinarToastExito(response, ['algo'])).toEqual({ level: 'warning', title: 'Plantilla procesada con advertencias SAP' })
  })
  it('success con validacion_sap.todos_validos=false -> warning aunque erroresSAP esté vacío', () => {
    const response = { status: 'success', validacion_sap: { todos_validos: false } } as any
    expect(determinarToastExito(response, [])).toEqual({ level: 'warning', title: 'Plantilla procesada con advertencias SAP' })
  })
  it('validation_error con pedido_id -> mensaje de guardado con advertencias', () => {
    const response = { status: 'validation_error', pedido_id: 'x' } as any
    expect(determinarToastExito(response, [])).toEqual({ level: 'warning', title: 'Plantilla procesada y guardada con advertencias. Revisa el detalle si lo deseas.' })
  })
  it('validation_error sin pedido_id -> mensaje generico', () => {
    const response = { status: 'validation_error' } as any
    expect(determinarToastExito(response, [])).toEqual({ level: 'warning', title: 'Plantilla procesada con advertencias' })
  })
  it('otro status -> null (sin toast)', () => {
    const response = { status: 'error' } as any
    expect(determinarToastExito(response, [])).toBeNull()
  })
})

describe('determinarToastReintento', () => {
  it('success -> nivel success con mensaje de correcciones aplicadas', () => {
    const response = { status: 'success', articulos_cargados: 3, distribuciones_cargadas: 1 } as any
    const r = determinarToastReintento(response, 'PED-1')
    expect(r?.level).toBe('success')
    expect(r?.title).toBe('Plantilla procesada con correcciones')
    expect(r?.message).toContain('Número de pedido: PED-1')
  })
  it('validation_error -> nivel warning', () => {
    const response = { status: 'validation_error', articulos_cargados: 1, distribuciones_cargadas: 1 } as any
    const r = determinarToastReintento(response, undefined)
    expect(r?.level).toBe('warning')
    expect(r?.message).toContain('Número de pedido: N/A')
  })
  it('otro status -> null', () => {
    const response = { status: 'error', articulos_cargados: 1, distribuciones_cargadas: 1 } as any
    expect(determinarToastReintento(response, 'PED-1')).toBeNull()
  })
})

describe('debeGuardarArchivoParaReintento', () => {
  it('true cuando el titulo menciona SAP', () => {
    expect(debeGuardarArchivoParaReintento({ title: 'Códigos no válidos en SAP' } as any)).toBe(true)
  })
  it('true cuando el titulo menciona producto', () => {
    expect(debeGuardarArchivoParaReintento({ title: 'Códigos de producto no encontrados en SAP' } as any)).toBe(true)
  })
  it('true cuando hay validacion_pack_pvp aunque el titulo no lo mencione', () => {
    expect(debeGuardarArchivoParaReintento({ title: 'Discrepancias de Pack/PVP', validacion_pack_pvp: {} } as any)).toBe(true)
  })
  it('false para un error generico sin ninguna de las señales', () => {
    expect(debeGuardarArchivoParaReintento({ title: 'Error de formato' } as any)).toBe(false)
  })
})

describe('extraerCodigosDeErrorInfo', () => {
  it('extrae producto de cada entrada objeto con producto', () => {
    const errorInfo = { errors: [{ producto: 'P1' }, 'string suelto', { producto: 'P2' }, { sinProducto: true }] } as any
    expect(extraerCodigosDeErrorInfo(errorInfo)).toEqual(['P1', 'P2'])
  })
  it('array vacío cuando no hay errors', () => {
    expect(extraerCodigosDeErrorInfo({} as any)).toEqual([])
  })
})

describe('construirMensajeToastError', () => {
  it('lista códigos truncada a 5 con "y N más"', () => {
    const msg = construirMensajeToastError({ message: 'x' } as any, ['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    expect(msg).toBe('Códigos no válidos: A, B, C, D, E y 2 más')
  })
  it('sin códigos, usa la primera línea del mensaje', () => {
    const msg = construirMensajeToastError({ message: 'Primera línea\nSegunda línea' } as any, [])
    expect(msg).toBe('Primera línea')
  })
})
