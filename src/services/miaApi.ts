/**
 * Cliente de mIAApi — asistente de IA sobre la documentación organizacional.
 *
 * Implementa el contrato de la Guía Técnica v1.0.0 (viva en /v1/integracion.md):
 *  - Sin autenticación: se envía el login AD real del usuario en `usuario_ad`
 *    (nunca un usuario genérico compartido: rompe la cuota por persona).
 *  - Timeout generoso (120 s): es un LLM generando texto, no una consulta SQL.
 *  - Los errores se deciden por el campo `error`, nunca por el status HTTP solo.
 *  - Reintentos SOLO para 503 sin-modelo y 429 demasiadas-peticiones, con
 *    espera exponencial (5 s → 15 s → 45 s), respetando Retry-After, máx. 3 intentos.
 *  - `sin_contexto: true` NO es un error: la respuesta ya viene redactada.
 *  - El `traza_id` se registra siempre en consola (auditoría del lado servidor).
 */
import axios, { AxiosError } from 'axios'
import { ENV } from '@/config/env'

// ─── Tipos del contrato ──────────────────────────────────────────────────────

export interface MiaFuente {
  area: string
  documento: string
  titulo: string
}

export interface MiaCuota {
  limite: number
  usadas: number
  restantes: number
  porcentaje_disponible: number
  /** ISO 8601 de cuándo se renueva la ventana */
  renueva: string
  renueva_en_segundos: number
  /** true cuando queda 10 % o menos — avisar al usuario, no ocultarla */
  advertencia: boolean
}

export interface MiaRespuesta {
  respuesta: string
  fuentes: MiaFuente[]
  /** true = la pregunta no tiene respuesta en la documentación. NO es un error; no reintentar. */
  sin_contexto: boolean
  areas_consultadas: string[]
  modelo: string
  ms: number
  traza_id: string
  cuota: MiaCuota
}

export interface MiaArea {
  codigo: string
  con_documentos: boolean
}

interface MiaErrorBody {
  error?: string
  message?: string
  detalles?: { campo: string; motivo: string }[]
  traza_id?: string
  cuota?: MiaCuota
  reintentar_en_segundos?: number
}

export class MiaApiError extends Error {
  constructor(
    /** Código del contrato: cuota-agotada, sin-modelo, peticion-invalida, … */
    public codigo: string,
    message: string,
    public trazaId?: string,
    public cuota?: MiaCuota,
    public reintentarEnSegundos?: number,
  ) {
    super(message)
    this.name = 'MiaApiError'
  }
}

// ─── Cliente ─────────────────────────────────────────────────────────────────

/** No reintentar: el resultado no cambia hasta corregir algo o dejar pasar el tiempo. */
const NO_REINTENTAR = new Set([
  'peticion-invalida', 'area-no-permitida', 'sin-areas', 'cuota-agotada', 'sin-indice',
])

const MENSAJES: Record<string, string> = {
  'cuota-agotada': 'Alcanzaste tu límite de consultas por ahora. Se renueva automáticamente en unas horas.',
  'sin-modelo': 'El motor de IA no está respondiendo en este momento. Intenta de nuevo en unos minutos.',
  'sin-indice': 'La base de conocimiento no está disponible. Ya se puede reportar al equipo de TI.',
  'sin-areas': 'No hay documentación publicada para consultar todavía.',
  'error-interno': 'Ocurrió un error inesperado en el asistente.',
  timeout: 'La consulta tardó demasiado y se canceló. Intenta de nuevo.',
  'sin-conexion': 'No se pudo conectar con el asistente. Verifica tu red o inténtalo más tarde.',
}

const http = axios.create({
  baseURL: ENV.MIA_URL,
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

/** Código del contrato a partir del error HTTP (timeout y red incluidos). */
function codigoDeError(err: AxiosError<MiaErrorBody>): string {
  if (err.response?.data?.error) return err.response.data.error
  return err.code === 'ECONNABORTED' ? 'timeout' : 'sin-conexion'
}

/** ¿El error es definitivo? (sin respuesta, no-reintenable, o se agotaron los intentos). */
function esErrorDefinitivo(err: AxiosError<MiaErrorBody>, codigo: string, esUltimoIntento: boolean): boolean {
  return !err.response || NO_REINTENTAR.has(codigo) || esUltimoIntento
}

function aMiaApiError(err: AxiosError<MiaErrorBody>, codigo: string): MiaApiError {
  const body = err.response?.data
  return new MiaApiError(
    codigo,
    body?.message ?? MENSAJES[codigo] ?? 'El asistente no pudo responder.',
    body?.traza_id,
    body?.cuota,
    body?.reintentar_en_segundos,
  )
}

/** Espera antes de reintentar: Retry-After del servidor si viene; si no, la espera exponencial local. */
function msDeEspera(err: AxiosError<MiaErrorBody>, esperaActual: number): number {
  const retryAfter = Number(err.response?.headers?.['retry-after'])
  const hayRetryAfter = Number.isFinite(retryAfter) && retryAfter > 0
  return hayRetryAfter ? retryAfter * 1000 : esperaActual
}

/**
 * Pregunta a mIA con reintentos responsables.
 * @param usuarioAd Login AD real del usuario (para cuota y auditoría).
 * @param areas Códigos de área; omitir = todas (correcto para preguntas generales).
 */
export async function preguntar(
  usuarioAd: string,
  pregunta: string,
  areas?: string[],
  intentos = 3,
): Promise<MiaRespuesta> {
  const cuerpo: Record<string, unknown> = { usuario_ad: usuarioAd, pregunta }
  if (areas?.length) cuerpo.areas = areas

  let espera = 5_000
  for (let intento = 0; intento < intentos; intento++) {
    try {
      const { data } = await http.post<MiaRespuesta>('/v1/preguntar', cuerpo)
      console.info(`[mIA] ok · traza ${data.traza_id} · ${data.ms} ms · cuota ${data.cuota.usadas}/${data.cuota.limite}`)
      return data
    } catch (e) {
      const err = e as AxiosError<MiaErrorBody>
      const codigo = codigoDeError(err)
      console.warn(`[mIA] error ${codigo} · traza ${err.response?.data?.traza_id ?? '-'}`)

      if (esErrorDefinitivo(err, codigo, intento === intentos - 1)) {
        throw aMiaApiError(err, codigo)
      }

      // Solo se llega acá con 503 sin-modelo o 429 demasiadas-peticiones.
      await sleep(msDeEspera(err, espera))
      espera *= 3
    }
  }
  throw new MiaApiError('sin-respuesta', 'El asistente no respondió tras varios intentos.')
}

/** Estado de cuota del usuario, sin consumir ninguna consulta. */
export async function consultarCuota(usuarioAd: string): Promise<MiaCuota> {
  const { data } = await http.get<MiaCuota>('/v1/cuota', { params: { usuario_ad: usuarioAd } })
  return data
}

/** Áreas con documentación disponible. Nunca hardcodear la lista: nacen y se dan de baja sin aviso. */
export async function consultarAreas(): Promise<MiaArea[]> {
  const { data } = await http.get<{ areas: MiaArea[] }>('/v1/areas')
  return data.areas ?? []
}

/** Estado del servicio (para monitoreo; no consume cuota). */
export async function salud(): Promise<boolean> {
  try {
    const { data } = await http.get<{ ok: boolean }>('/v1/salud', { timeout: 10_000 })
    return data.ok === true
  } catch {
    return false
  }
}
