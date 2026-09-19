import { tesoreriaHttp } from '@/lib/http'
import type {
  ActualizarContactoNotificacionPayload,
  ActualizarEstadoCuentaPayload,
  AuditoriaGlobalDto,
  CambiarEstadoContactoPayload,
  ConfiguracionTesoreriaDto,
  ContactoNotificacionDto,
  CrearContactoNotificacionPayload,
  CrearDepositoPayload,
  CuentaFinancieraDto,
  DepositoDto,
  DetalleDiarioDto,
  EnviarCorreoPruebaResultadoDto,
  ErrorRespuestaTesoreria,
  GetAuditoriaGlobalParams,
  GetResumenDepositosParams,
  PaginatedList,
  ResultadoNotificacionesDto,
  ResultadoSincronizacionCuentasDto,
  ResumenComparativoDto,
  UpdateConfiguracionRequest,
  UrlComprobanteDto
} from '../types/tesoreria.types'

/**
 * api-tesoreria devuelve errores como ProblemDetails: `errors` (diccionario campo -> mensajes)
 * cuando la causa es una regla de negocio/validación (400), o `title` con el mensaje humano para
 * el resto (404/409/502). Esta función homogeneiza ambos casos en un mensaje único, listo para
 * mostrar al usuario sin tecnicismos ni códigos crudos.
 *
 * Para errores no mapeados (500 genérico), el backend deliberadamente NO expone el detalle de la
 * excepción; en su lugar se anexa el `correlationId` (si vino en la respuesta) para facilitar trazabilidad.
 */
export function extraerMensajeError(error: unknown, fallback = 'No se pudo completar la operación. Intente nuevamente.'): string {
  const err = error as ErrorRespuestaTesoreria | null | undefined
  const data = err?.response?.data
  if (data?.errors) {
    const mensajes = Object.values(data.errors).flat()
    if (mensajes.length > 0) return mensajes.join(' ')
  }

  const mensajeBase = data?.detail || data?.title || err?.message || fallback
  return data?.correlationId ? `${mensajeBase} (Ref: ${data.correlationId})` : mensajeBase
}

/**
 * Extrae el diccionario campo -> mensaje (el primero, si hay varios) de un ProblemDetails de
 * validación (400) o de conflicto (409, p. ej. papeleta duplicada), para resaltar el campo
 * culpable en el formulario en vez de solo mostrar un toast con el mensaje aplanado.
 */
export function extraerErroresCampo(error: unknown): Record<string, string> | null {
  const err = error as ErrorRespuestaTesoreria | null | undefined
  const data = err?.response?.data

  const resultado: Record<string, string> = {}
  for (const [campo, mensajes] of Object.entries(data?.errors ?? {})) {
    const mensaje = typeof mensajes === 'string' ? mensajes : mensajes?.[0]
    if (typeof mensaje !== 'string' || !mensaje.trim()) continue
    const nombre = campo.split('.').pop() ?? campo
    const clave = nombre.toLowerCase() === 'numerocomprobante' ? 'NumeroComprobante' : nombre
    resultado[clave] = mensaje
  }
  const detail = data?.detail
  const status = err?.response?.status ?? data?.status
  if (!resultado.NumeroComprobante && typeof detail === 'string' && detail.trim() &&
    (status === 409 || /comprobante|papeleta/i.test(detail))) {
    resultado.NumeroComprobante = detail
  }
  return Object.keys(resultado).length > 0 ? resultado : null
}

/** Valores que en la UI significan "sin filtro de almacén" — nunca deben viajar como querystring literal. */
const SENTINELS_TODOS_LOS_ALMACENES = new Set(['todos', 'todos los almacenes', 'todos los almacen', ''])

/**
 * Construye el querystring de auditoría de forma defensiva: `pageNumber`/`pageSize` siempre
 * llevan un valor entero válido (el backend los exige: pageNumber >= 1, pageSize entre 1 y 200),
 * y `codigoAlmacen` se OMITE por completo del objeto de params si es nulo o centinela.
 */
function buildAuditoriaGlobalParams(
  params: GetAuditoriaGlobalParams | Omit<GetAuditoriaGlobalParams, 'pageNumber' | 'pageSize'>
): Record<string, string | number> {
  const query: Record<string, string | number> = {
    fechaDesde: params.fechaDesde,
    fechaHasta: params.fechaHasta
  }

  if ('pageNumber' in params) query.pageNumber = Math.max(1, params.pageNumber ?? 1)
  if ('pageSize' in params) query.pageSize = Math.min(200, Math.max(1, params.pageSize ?? 20))

  const codigoAlmacen = params.codigoAlmacen?.trim().toUpperCase() ?? ''
  if (codigoAlmacen && !SENTINELS_TODOS_LOS_ALMACENES.has(codigoAlmacen.toLowerCase())) {
    query.codigoAlmacen = codigoAlmacen
  }

  if (params.estado && params.estado !== 'TODOS') {
    query.estado = params.estado
  }

  return query
}

function buildCrearDepositoFormData(payload: CrearDepositoPayload): FormData {
  const form = new FormData()
  form.append('AlmacenId', String(payload.almacenId))
  form.append('CodigoAlmacen', payload.codigoAlmacen)
  form.append('FechaCierreCaja', payload.fechaCierreCaja)
  form.append('FechaDepositoBanco', payload.fechaDepositoBanco)
  form.append('CuentaFinancieraId', String(payload.cuentaFinancieraId))
  form.append('NumeroComprobante', payload.numeroComprobante)
  form.append('MontoDepositado', String(payload.montoDepositado))
  form.append('Moneda', payload.moneda)
  form.append('TipoDeposito', payload.tipoDeposito)
  form.append('Responsable', payload.responsable)
  form.append('EsSobrante', String(payload.esSobrante))
  form.append('Comprobante', payload.comprobante, payload.comprobante.name)
  return form
}

function extraerNombreArchivo(contentDisposition: string | undefined, fallback: string): string {
  const match = contentDisposition?.match(/filename[^;=\n]*=["']?([^"';\n]+)["']?/)
  return match?.[1]?.trim() || fallback
}

function descargarBlob(data: BlobPart, mimeType: string, filename: string): void {
  const blob = new Blob([data], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const tesoreriaService = {
  async getResumen(params: GetResumenDepositosParams): Promise<ResumenComparativoDto[]> {
    const { data } = await tesoreriaHttp.get<ResumenComparativoDto[]>('/depositos/resumen', { params })
    return data
  },

  async getDetalle(codigoAlmacen: string, fechaCierre: string): Promise<DetalleDiarioDto> {
    const { data } = await tesoreriaHttp.get<DetalleDiarioDto>(
      `/depositos/detalle/${encodeURIComponent(codigoAlmacen)}/${fechaCierre}`
    )
    return data
  },

  async crearDeposito(payload: CrearDepositoPayload): Promise<DepositoDto> {
    const { data } = await tesoreriaHttp.post<DepositoDto>('/depositos', buildCrearDepositoFormData(payload))
    return data
  },

  async integrarSap(depositoId: number): Promise<DepositoDto> {
    const { data } = await tesoreriaHttp.post<DepositoDto>(`/depositos/${depositoId}/integrar-sap`)
    return data
  },

  async anularDeposito(depositoId: number, motivo: string, confirmacionSapReversado = false): Promise<DepositoDto> {
    const { data } = await tesoreriaHttp.delete<DepositoDto>(`/depositos/${depositoId}`, {
      params: { motivo, confirmacionSapReversado }
    })
    return data
  },

  async getAuditoriaGlobal(params: GetAuditoriaGlobalParams): Promise<PaginatedList<AuditoriaGlobalDto>> {
    const { data } = await tesoreriaHttp.get<PaginatedList<AuditoriaGlobalDto>>('/auditoria/global', {
      params: buildAuditoriaGlobalParams(params)
    })
    return data
  },

  async exportarAuditoriaCsv(params: Omit<GetAuditoriaGlobalParams, 'pageNumber' | 'pageSize'>): Promise<void> {
    const response = await tesoreriaHttp.get('/auditoria/exportar-csv', {
      params: buildAuditoriaGlobalParams(params),
      responseType: 'blob'
    })
    const hoy = new Date()
    const yyyymmdd = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`
    const filename = extraerNombreArchivo(
      response.headers['content-disposition'],
      `Auditoria_Depositos_Mabel_${yyyymmdd}.csv`
    )
    descargarBlob(response.data as BlobPart, 'text/csv;charset=utf-8', filename)
  },

  async getCuentasFinancieras(): Promise<CuentaFinancieraDto[]> {
    const { data } = await tesoreriaHttp.get<CuentaFinancieraDto[]>('/cuentas-financieras')
    return data
  },

  /** Catálogo completo (activas e inactivas) para la pantalla de gestión de Contabilidad/Admin. */
  async getTodasCuentasFinancieras(): Promise<CuentaFinancieraDto[]> {
    const { data } = await tesoreriaHttp.get<CuentaFinancieraDto[]>('/cuentas-financieras/gestion')
    return data
  },

  async actualizarEstadoCuenta(id: number, payload: ActualizarEstadoCuentaPayload): Promise<CuentaFinancieraDto> {
    const { data } = await tesoreriaHttp.patch<CuentaFinancieraDto>(`/cuentas-financieras/${id}/estado`, payload)
    return data
  },

  /**
   * Sincroniza manualmente el subconjunto bancario (FormatCode 1.01.01/11.01.01) del plan de
   * cuentas de SAP Business One para Mabel Trading. El comando ignora el tenant del request: SAP
   * solo administra este catálogo para esa empresa, sin importar cuál esté seleccionada en la UI.
   */
  async sincronizarCuentasSap(): Promise<ResultadoSincronizacionCuentasDto> {
    const { data } = await tesoreriaHttp.post<ResultadoSincronizacionCuentasDto>('/cuentas-financieras/sincronizar-sap')
    return data
  },

  async obtenerUrlComprobante(depositoId: number): Promise<UrlComprobanteDto> {
    const { data } = await tesoreriaHttp.get<UrlComprobanteDto>(`/depositos/${depositoId}/comprobante/url`)
    return data
  },

  async getConfiguracion(): Promise<ConfiguracionTesoreriaDto> {
    const { data } = await tesoreriaHttp.get<ConfiguracionTesoreriaDto>('/configuracion')
    return data
  },

  async updateConfiguracion(payload: UpdateConfiguracionRequest): Promise<ConfiguracionTesoreriaDto> {
    const { data } = await tesoreriaHttp.put<ConfiguracionTesoreriaDto>('/configuracion', payload)
    return data
  },

  /** Fuerza una corrida inmediata del motor de notificaciones, sin esperar al cron de las 14:00. */
  async ejecutarCorteNotificaciones(): Promise<ResultadoNotificacionesDto> {
    const { data } = await tesoreriaHttp.post<ResultadoNotificacionesDto>('/notificaciones/ejecutar-corte')
    return data
  },

  async getContactosNotificacion(): Promise<ContactoNotificacionDto[]> {
    const { data } = await tesoreriaHttp.get<ContactoNotificacionDto[]>('/contactos-notificacion')
    return data
  },

  async crearContactoNotificacion(payload: CrearContactoNotificacionPayload): Promise<ContactoNotificacionDto> {
    const { data } = await tesoreriaHttp.post<ContactoNotificacionDto>('/contactos-notificacion', payload)
    return data
  },

  async actualizarContactoNotificacion(id: number, payload: ActualizarContactoNotificacionPayload): Promise<ContactoNotificacionDto> {
    const { data } = await tesoreriaHttp.put<ContactoNotificacionDto>(`/contactos-notificacion/${id}`, payload)
    return data
  },

  async cambiarEstadoContacto(id: number, payload: CambiarEstadoContactoPayload): Promise<ContactoNotificacionDto> {
    const { data } = await tesoreriaHttp.patch<ContactoNotificacionDto>(`/contactos-notificacion/${id}/estado`, payload)
    return data
  },

  async eliminarContactoNotificacion(id: number): Promise<void> {
    await tesoreriaHttp.delete(`/contactos-notificacion/${id}`)
  },

  async enviarCorreoPruebaContactos(): Promise<EnviarCorreoPruebaResultadoDto> {
    const { data } = await tesoreriaHttp.post<EnviarCorreoPruebaResultadoDto>('/contactos-notificacion/enviar-prueba')
    return data
  }
}

/** Alias para mantener compatibilidad */
export const tesoreriaApi = tesoreriaService
