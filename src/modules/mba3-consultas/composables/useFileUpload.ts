/**
 * Composable para manejar la carga de archivos Excel (plantillas)
 * ⭐ Con soporte para progreso de carga y procesamiento
 */
import { ref, Ref } from '@vue/reactivity'
import { onUnmounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { MAX_EXCEL_UPLOAD_SIZE_BYTES, MAX_EXCEL_UPLOAD_SIZE_MB } from '@/config/uploadLimits'
import { pedidosService } from '../services/domains/pedidos'
import { normalizeValidationResponse } from '../services/utils/errorHandler'
import type { UploadPlantillaResponse, PedidoCompleto, PlantillaProcesoEstado } from '../types'
import { SAP_MAY_STILL_PROCESSING_MESSAGE } from '../utils/httpErrors'
import { plantillaStreamUrl } from '../utils/asyncJobStreamUrls'
import { followAsyncJobSseOrPoll } from '../utils/followAsyncJobSseOrPoll'

// Constantes de configuración
const ALLOWED_FILE_EXTENSIONS = ['.xlsx', '.xls'] as const
// ⭐ Intervalo para simulación de progreso durante procesamiento del servidor
const PROCESSING_PROGRESS_INTERVAL_MS = 500
/** Porción de la barra reservada a la subida HTTP; el resto refleja procesamiento en servidor/Celery */
const UPLOAD_PROGRESS_WEIGHT = 25
const PROCESSING_SIMULATION_CAP = 92
const PLANTILLA_POLL_INTERVAL_MS = 2000
const PLANTILLA_WORKER_PICKUP_TIMEOUT_MS = 60000
const PLANTILLA_PROCESSING_TIMEOUT_MS = 11 * 60 * 1000
// Rutas explícitas tras subir plantilla / reintentar con correcciones (nunca usar caja-chica u otras rutas)
const RUTA_CARGAR_PLANTILLA_BASE = '/mba3-consultas/cargar-plantilla'
const RUTA_PEDIDOS_BASE = '/mba3-consultas/pedidos'

/** Mapea progreso de bytes enviados (0–100) al tramo inicial de la barra */
export function mapFileUploadProgress(uploadPercent0to100: number): number {
  const pct = Math.min(100, Math.max(0, uploadPercent0to100))
  return Math.round((pct / 100) * UPLOAD_PROGRESS_WEIGHT)
}

/** Mapea progreso reportado por el backend/Celery (0–100) al tramo de procesamiento */
export function mapServerProcessingProgress(serverPercent0to100: number): number {
  const pct = Math.min(100, Math.max(0, serverPercent0to100))
  return Math.round(UPLOAD_PROGRESS_WEIGHT + (pct / 100) * (100 - UPLOAD_PROGRESS_WEIGHT))
}

const PLANTILLA_STEP_MESSAGES: Record<string, string> = {
  iniciando: 'Iniciando procesamiento...',
  leyendo: 'Leyendo archivo Excel...',
  leyendo_archivo: 'Leyendo archivo Excel...',
  validando: 'Validando estructura del archivo...',
  validando_estructura: 'Validando estructura del archivo...',
  validando_sap: 'Verificando códigos en SAP...',
  sap: 'Verificando códigos en SAP...',
  guardando: 'Guardando datos del pedido...',
  persistiendo: 'Guardando datos del pedido...',
  finalizando: 'Finalizando procesamiento...',
}

function messageFromPlantillaStep(step?: string): string | undefined {
  if (!step) return undefined
  const key = step.toLowerCase().replace(/-/g, '_')
  if (PLANTILLA_STEP_MESSAGES[key]) return PLANTILLA_STEP_MESSAGES[key]
  const partial = Object.entries(PLANTILLA_STEP_MESSAGES).find(([k]) => key.includes(k))
  return partial?.[1]
}

function applyPlantillaProcessingUpdate(estado: PlantillaProcesoEstado, refs: {
  uploadMessage: { value: string }
  uploadProgress: { value: number }
}): void {
  refs.uploadMessage.value =
    estado.message?.trim() ||
    messageFromPlantillaStep(estado.step) ||
    refs.uploadMessage.value
  refs.uploadProgress.value = mapServerProcessingProgress(estado.progress ?? 0)
}

/** Prefijo para guardar correcciones a resaltar por pedido (origen de verdad tras redirect en flujo async) */
export const RESALTADO_CODIGOS_STORAGE_PREFIX = 'resaltado_codigos_'

function saveCorreccionesParaResaltado(numeroPedido: string, response: UploadPlantillaResponse | PlantillaProcesoEstado | undefined): void {
  if (!numeroPedido) return
  // GET resultado cuando status === 'completed': el cuerpo es el resultado (sin wrapper); correcciones_aplicadas en la raíz
  const payload = (response && 'resultado' in response ? response.resultado : undefined) ?? (response as any)?.result ?? response
  const correcciones = payload?.correcciones_aplicadas ?? payload?.correccionesAplicadas ?? (response && 'correcciones_aplicadas' in response ? response.correcciones_aplicadas : undefined) ?? (response as any)?.correccionesAplicadas
  const list = Array.isArray(correcciones) ? correcciones : []
  try {
    sessionStorage.setItem(RESALTADO_CODIGOS_STORAGE_PREFIX + numeroPedido, JSON.stringify(list))
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[useFileUpload] No se pudo guardar correcciones en sessionStorage:', e)
  }
}

export interface UploadErrorInfo {
  title?: string
  message: string
  fileName?: string
  errors?: Array<string | { tipo?: string; campo?: string; mensaje: string; producto?: string }>
  // ⭐ NUEVO: Código de error específico del backend
  error_code?: string
  // ⭐ NUEVO: Número de pedido (para errores de duplicación)
  numero_pedido?: string
  // ⭐ NUEVO: Información de validación SAP del backend (incluye MBA3 y sugerencias)
  validacion_sap?: {
    detalle_validacion?: Record<string, {
      existe?: boolean
      severity?: string
      error?: string
      mensaje?: string
      // ⭐ NUEVO: Pack/PVP tal como venían en esa fila del Excel (null si no venían). Permite comparar
      // contra pack_sap/pvp_sap (GET /api/plantillas/sap-info-productos) apenas se elige una sugerencia,
      // sin esperar a un reintento.
      pack_excel?: string | null
      pvp_excel?: number | null
      mba3?: {
        codigo?: string
        nombre?: string
        corp?: string
        grupo_prenda?: string
        talla?: string
        presentacion?: string
        descontinuado?: boolean
        inactive?: boolean
      }
      sugerencias_sap?: Array<{
        codigo: string
        nombre: string
        pack?: string
        group_code?: number
        group_name?: string
        estado: string
        score: number
        score_porcentaje: number
        motivos: string[]
      }>
    }>
  }
  // ⭐ NUEVO: Discrepancias de Pack/PVP contra SAP (RN-02) — error_code 'PACK_PVP_INVALIDOS_SAP'
  validacion_pack_pvp?: {
    pack_mismatches: Array<{ codigo: string; pack_excel: string; pack_sap: string }>
    pvp_mismatches: Array<{ codigo: string; pvp_excel: number; pvp_sap: number }>
    mensajes?: string[]
  }
}

/**
 * Correcciones que el usuario puede aplicar desde UploadErrorModal en un solo reintento.
 * Solo cubre código de producto: las discrepancias de Pack/PVP contra SAP (RN-02) son siempre
 * bloqueantes y se corrigen fuera del sistema (Excel o SAP), no hay corrección aplicable aquí.
 */
export interface CorreccionesPlantilla {
  correccionesCodigos?: Record<string, string>
}

type ErrorEntry = string | { tipo?: string; campo?: string; mensaje: string; producto?: string }

/** Combina las distintas fuentes posibles de mensaje de error en un solo string, sin duplicados. */
function construirMensajeCompletoParaBusqueda(e: any): string {
  const mensajesUnicos = new Set([
    e.message,
    e.response?.data?.error,
    e.response?.data?.message,
    e.response?.data?.detail,
    e.response?.data?.data?.error,
    e.response?.data?.data?.message
  ].filter(Boolean))
  return Array.from(mensajesUnicos).join(' ') || ''
}

/** Asigna codigos ya extraidos de una sección al array (productos/tiendas/bodegas) que corresponda según tipo. */
function clasificarCodigosPorTipo(tipo: string, codigos: string[], productos: string[], tiendas: string[], bodegas: string[]): void {
  if (tipo.includes('PRODUCTO')) {
    productos.push(...codigos)
  } else if (tipo.includes('TIENDA')) {
    tiendas.push(...codigos)
  } else if (tipo.includes('BODEGA')) {
    bodegas.push(...codigos)
  } else {
    // Si no especifica tipo, asumir que pueden ser tiendas/bodegas (formato genérico)
    tiendas.push(...codigos)
  }
}

/** Procesa una sección "❌ Códigos ... (N):\n   • ..." y clasifica sus códigos. */
function procesarSeccionCodigosEstructurados(section: string, productos: string[], tiendas: string[], bodegas: string[]): void {
  const tipoMatch = section.match(/Códigos (?:de )?(PRODUCTO|TIENDA|BODEGA|NO ENCONTRADOS)/i)
  const tipo = tipoMatch ? tipoMatch[1] : 'NO ENCONTRADOS'
  const codigosMatch = section.match(/\s*•\s*([^\n]+)/g)
  if (!codigosMatch) return
  const codigos = codigosMatch.map(line => line.replace(/^\s*•\s*/, '').trim()).filter(c => c)
  clasificarCodigosPorTipo(tipo, codigos, productos, tiendas, bodegas)
}

/**
 * Extrae códigos del formato estructurado del backend:
 * "❌ Códigos NO ENCONTRADOS en SAP (N):\n   • CODIGO1\n   • CODIGO2\n..."
 */
function extraerCodigosFormatoEstructurado(errorMessageStr: string): { productos: string[]; tiendas: string[]; bodegas: string[] } {
  const productos: string[] = []
  const tiendas: string[] = []
  const bodegas: string[] = []
  const codigosNoEncontradosMatch = errorMessageStr.match(/❌ Códigos (?:de )?(PRODUCTO|TIENDA|BODEGA|NO ENCONTRADOS)[\s\S]*?\((?:[^)]+)\):\s*\n((?:\s*•\s*[^\n]+\n?)+)/gi)
  if (!codigosNoEncontradosMatch) return { productos, tiendas, bodegas }
  for (const section of codigosNoEncontradosMatch) {
    procesarSeccionCodigosEstructurados(section, productos, tiendas, bodegas)
  }
  return { productos, tiendas, bodegas }
}

/** Primer patrón (de una lista) que matchee, filtrando códigos puramente numéricos. */
function extraerPrimerPatronConCodigos(errorMessageStr: string, patterns: RegExp[]): string[] {
  for (const pattern of patterns) {
    const match = errorMessageStr.match(pattern)
    if (match && match[1]) {
      const codigos = match[1].split(',').map(c => c.trim()).filter(c => c && c.length > 0 && !c.match(/^\d+$/))
      if (codigos.length > 0) return codigos
    }
  }
  return []
}

/** Acumula códigos de TODOS los patrones que matcheen (sin excluir puramente numéricos). */
function extraerTodosPatronesConCodigos(errorMessageStr: string, patterns: RegExp[]): string[] {
  const productos: string[] = []
  for (const pattern of patterns) {
    const match = errorMessageStr.match(pattern)
    if (match && match[1]) {
      productos.push(...match[1].split(',').map(c => c.trim()).filter(c => c))
    }
  }
  return productos
}

/** Fallback: si aún no hay códigos, busca en la última parte del mensaje tras ":". */
function extraerCodigosDespuesDeDosPuntos(errorMessageStr: string): string[] {
  if (!errorMessageStr.includes(':')) return []
  const partes = errorMessageStr.split(':')
  if (partes.length <= 1) return []
  const ultimaParte = partes[partes.length - 1].trim()
  if (!(ultimaParte.includes(',') || ultimaParte.split(/\s+/).length > 1)) return []
  const posiblesCodigos = ultimaParte.split(',').map(c => c.trim()).filter(c => {
    return c && c.length > 0 && !c.match(/^\d+$/) && c.match(/[A-Za-z0-9.-]+/)
  })
  if (posiblesCodigos.length > 0 && import.meta.env.DEV) {
    console.log('✅ [useFileUpload] Códigos extraídos de la última parte del mensaje:', posiblesCodigos)
  }
  return posiblesCodigos
}

/** Extrae códigos de producto del formato antiguo (regex sobre el mensaje, sin datos estructurados). */
function extraerCodigosPatronesLegacy(errorMessageStr: string, productosPrevios: string[]): string[] {
  // Patrón para: "❌ Validación SAP productos falló: Productos no encontrados (N): CODIGO1, CODIGO2"
  // Solo se usa el primer patrón de esta lista que coincida.
  const validacionSapPatterns = [
    /❌\s*Validación\s+SAP\s+productos?\s+falló:\s*Productos?\s+no\s+encontrados?\s*\([^)]*\):\s*([A-Za-z0-9,.\s-]+)/i,
    /Validación\s+SAP\s+productos?\s+falló:\s*Productos?\s+no\s+encontrados?\s*\([^)]*\):\s*([A-Za-z0-9,.\s-]+)/i,
    /Productos?\s+no\s+encontrados?\s*\([^)]*\):\s*([A-Za-z0-9,.\s-]+)/i,
    /Productos?\s+no\s+encontrados?\s+en\s+SAP[^:]*:\s*([A-Za-z0-9,.\s-]+)/i
  ]
  const productos: string[] = [...extraerPrimerPatronConCodigos(errorMessageStr, validacionSapPatterns)]

  // Si aún no se encontraron códigos (contando también lo que ya se había encontrado antes, ej.
  // formato estructurado), buscar en todo el mensaje cualquier patrón de códigos después de ":"
  if (productosPrevios.length + productos.length === 0) {
    productos.push(...extraerCodigosDespuesDeDosPuntos(errorMessageStr))
  }

  const sapErrorPatterns = [
    /Productos no encontrados en SAP:\s*([A-Za-z0-9,.\s-]+)/i,
    /no válidos en SAP[^:]*:\s*([A-Za-z0-9,.\s-]+)/i,
    /No se encontró información en SAP para SKU:\s*([A-Za-z0-9,.\s-]+)/i,
    /Productos?\s+no\s+encontrados?\s*\([^)]*\):\s*([A-Za-z0-9,.\s-]+)/i
  ]
  productos.push(...extraerTodosPatronesConCodigos(errorMessageStr, sapErrorPatterns))

  return productos
}

/**
 * Extrae códigos no encontrados + entradas de error detalladas desde errorData.validacion y
 * errorData.validacion_sap (formato estándar y su variante anidada bajo errorData.data,
 * usada por BusinessException). Muta errorErrors (push) y devuelve los códigos hallados.
 */
type CodigosPorTipo = { productos: string[]; tiendas: string[]; bodegas: string[] }

/** errorData.validacion.{productos,tiendas,bodegas,cantidades} -> códigos + entradas de error. */
function extraerDesdeValidacion(errorData: any, errorErrors: ErrorEntry[]): CodigosPorTipo {
  const productos: string[] = []
  const tiendas: string[] = []
  const bodegas: string[] = []
  const validacion = errorData.validacion
  if (!validacion) return { productos, tiendas, bodegas }

  if (validacion.productos?.no_encontrados?.length > 0) {
    const noEncontrados = Array.isArray(validacion.productos.no_encontrados) ? validacion.productos.no_encontrados : []
    noEncontrados.forEach((codigo: string) => {
      errorErrors.push({ tipo: 'ERROR', campo: 'Producto SAP', mensaje: `El código no existe en SAP`, producto: codigo })
      if (!productos.includes(codigo)) productos.push(codigo)
    })
  }

  if (validacion.tiendas?.no_encontradas?.length > 0) {
    const noEncontradas = Array.isArray(validacion.tiendas.no_encontradas) ? validacion.tiendas.no_encontradas : []
    noEncontradas.forEach((codigo: string) => {
      errorErrors.push({ tipo: 'ERROR', campo: 'Tienda/Bodega SAP', mensaje: `El código no existe en SAP OWHS`, producto: codigo })
      if (!tiendas.includes(codigo)) tiendas.push(codigo)
    })
  }

  if (validacion.bodegas?.no_encontradas?.length > 0) {
    const noEncontradas = Array.isArray(validacion.bodegas.no_encontradas) ? validacion.bodegas.no_encontradas : []
    noEncontradas.forEach((codigo: string) => {
      errorErrors.push({ tipo: 'ERROR', campo: 'Bodega SAP', mensaje: `El código no existe en SAP OWHS`, producto: codigo })
      if (!bodegas.includes(codigo)) bodegas.push(codigo)
    })
  }

  if (validacion.cantidades && (!validacion.cantidades.valid || validacion.cantidades.errors > 0)) {
    errorErrors.push({
      tipo: 'ERROR',
      campo: 'Cantidad',
      mensaje: `Errores de validación en cantidades (${validacion.cantidades.errors} error(es), ${validacion.cantidades.warnings} advertencia(s))`,
      producto: undefined
    })
  }

  return { productos, tiendas, bodegas }
}

/** errorData.validacion_sap.{no_encontrados,errores} -> códigos + entradas de error. */
function extraerDesdeValidacionSap(errorData: any, e: any, errorErrors: ErrorEntry[], productosPrevios: string[]): string[] {
  const productos: string[] = []
  const sap = errorData.validacion_sap
  if (!sap) return productos

  if (Array.isArray(sap.no_encontrados)) {
    sap.no_encontrados.forEach((codigo: string) => {
      if (!productos.includes(codigo)) productos.push(codigo)
    })
  } else if (typeof sap.no_encontrados === 'number' && sap.no_encontrados > 0) {
    // ⭐ COMPATIBILIDAD: Si el backend aún envía número (formato antiguo), buscar en otros campos
    if (errorData.validacion?.productos?.no_encontrados && Array.isArray(errorData.validacion.productos.no_encontrados) && errorData.validacion.productos.no_encontrados.length > 0) {
      errorData.validacion.productos.no_encontrados.forEach((codigo: string) => {
        if (!productos.includes(codigo)) productos.push(codigo)
      })
    }
    // Cuenta también lo ya encontrado por otras fuentes (mensaje, validacion.productos) antes de
    // este punto: si YA hay códigos específicos de otro lado, no pisarlos con el conteo numérico.
    if (productosPrevios.length + productos.length === 0) {
      ;(e as any).sapNoEncontradosCount = sap.no_encontrados
    }
  }

  if (Array.isArray(sap.errores) && sap.errores.length > 0) {
    sap.errores.forEach((errorMsg: string) => {
      errorErrors.push({ tipo: 'ERROR', campo: 'ValidacionSAP', mensaje: errorMsg, producto: undefined })
    })
  } else if (typeof sap.errores === 'number' && sap.errores > 0) {
    errorErrors.push({
      tipo: 'ERROR',
      campo: 'ValidacionSAP',
      mensaje: `${sap.no_encontrados?.length || sap.total_no_encontrados || 0} código(s) no encontrado(s) en SAP, ${sap.errores} error(es)`,
      producto: undefined
    })
  }

  return productos
}

function agregarSinDuplicados(target: string[], codigo: string): void {
  if (!target.includes(codigo)) target.push(codigo)
}

function extraerSapDataAnidado(errorData: any, productos: string[]): void {
  if (!errorData.data?.validacion_sap) return
  const sapData = errorData.data.validacion_sap
  if (import.meta.env.DEV) console.log('✅ [useFileUpload] Encontrada validacion_sap en errorData.data.validacion_sap:', sapData)
  if (Array.isArray(sapData.no_encontrados)) {
    sapData.no_encontrados.forEach((codigo: string) => agregarSinDuplicados(productos, codigo))
  }
}

function extraerValidacionAnidada(errorData: any, productos: string[], tiendas: string[], bodegas: string[]): void {
  if (!errorData.data?.validacion) return
  const validacion = errorData.data.validacion
  if (import.meta.env.DEV) console.log('✅ [useFileUpload] Encontrada validacion en errorData.data.validacion:', validacion)
  if (validacion.productos?.no_encontrados && Array.isArray(validacion.productos.no_encontrados)) {
    validacion.productos.no_encontrados.forEach((codigo: string) => agregarSinDuplicados(productos, codigo))
  }
  if (validacion.tiendas?.no_encontradas && Array.isArray(validacion.tiendas.no_encontradas)) {
    validacion.tiendas.no_encontradas.forEach((codigo: string) => agregarSinDuplicados(tiendas, codigo))
  }
  if (validacion.bodegas?.no_encontradas && Array.isArray(validacion.bodegas.no_encontradas)) {
    validacion.bodegas.no_encontradas.forEach((codigo: string) => agregarSinDuplicados(bodegas, codigo))
  }
}

/** errorData.data.{validacion_sap,validacion} -> variante anidada usada por BusinessException. */
function extraerDesdeDataAnidado(errorData: any): CodigosPorTipo {
  const productos: string[] = []
  const tiendas: string[] = []
  const bodegas: string[] = []

  if (import.meta.env.DEV) console.log('🔍 [useFileUpload] Verificando errorData.data:', errorData.data)

  extraerSapDataAnidado(errorData, productos)
  extraerValidacionAnidada(errorData, productos, tiendas, bodegas)

  return { productos, tiendas, bodegas }
}

function extraerDesdeResponseData(errorData: any, e: any, errorErrors: ErrorEntry[], productosPrevios: string[]): CodigosPorTipo {
  if (errorData.errores && Array.isArray(errorData.errores)) {
    errorErrors.push(...errorData.errores)
  }

  const desdeValidacion = extraerDesdeValidacion(errorData, errorErrors)
  const productosDesdeSap = extraerDesdeValidacionSap(errorData, e, errorErrors, [...productosPrevios, ...desdeValidacion.productos])
  const desdeDataAnidado = extraerDesdeDataAnidado(errorData)

  return {
    productos: [...desdeValidacion.productos, ...productosDesdeSap, ...desdeDataAnidado.productos],
    tiendas: [...desdeValidacion.tiendas, ...desdeDataAnidado.tiendas],
    bodegas: [...desdeValidacion.bodegas, ...desdeDataAnidado.bodegas]
  }
}

/**
 * Si el backend envió validacion_sap/validacion con no_encontrados estructurado, usar SOLO esos
 * códigos como fuente de verdad (evita falsos positivos del parsing de mensaje). Muta errorErrors
 * (splice/push) y devuelve la lista de productos a usar de acá en adelante.
 */
function consolidarCodigosEstructurados(errorData: any, errorErrors: ErrorEntry[], productosActuales: string[]): string[] {
  const structuredNoEncontrados: string[] = [
    ...(Array.isArray(errorData?.validacion_sap?.no_encontrados) ? errorData.validacion_sap.no_encontrados : []),
    ...(Array.isArray(errorData?.validacion?.productos?.no_encontrados) ? errorData.validacion.productos.no_encontrados : []),
    ...(Array.isArray(errorData?.data?.validacion_sap?.no_encontrados) ? errorData.data.validacion_sap.no_encontrados : []),
    ...(Array.isArray(errorData?.data?.validacion?.productos?.no_encontrados) ? errorData.data.validacion.productos.no_encontrados : [])
  ]
  if (structuredNoEncontrados.length === 0) return productosActuales

  const productos = [...new Set(structuredNoEncontrados)]
  // Quitar entradas "Producto SAP" que no estén en la lista real (eran del parsing del mensaje)
  for (let i = errorErrors.length - 1; i >= 0; i--) {
    const err = errorErrors[i]
    if (typeof err !== 'string' && err.campo === 'Producto SAP' && err.producto && !productos.includes(err.producto)) {
      errorErrors.splice(i, 1)
    }
  }
  // Asegurar una entrada por cada código real
  const existingProductos = new Set(
    (errorErrors.filter(er => typeof er !== 'string' && er.campo === 'Producto SAP') as Array<{ producto?: string }>).map(er => er.producto)
  )
  productos.forEach(codigo => {
    if (!existingProductos.has(codigo)) {
      errorErrors.push({ tipo: 'ERROR', campo: 'Producto SAP', mensaje: 'El código no existe en SAP', producto: codigo })
    }
  })
  return productos
}

/** Mensajes de error (formato, etc.) no son códigos de producto SAP, aunque el regex los haya capturado. */
function looksLikeProductCode(s: string): boolean {
  if (!s || typeof s !== 'string' || s.length > 35) return false
  const lower = s.toLowerCase()
  if (lower.includes('formato') || lower.includes('archivo') || lower.includes('excel') || lower.includes('estructura') || lower.includes('hoja') || lower.includes('cabecera') || lower.includes('detalle') || lower.includes('requerida')) return false
  return /^[A-Za-z0-9.\s-]+$/.test(s.trim())
}

/** Filtra falsos positivos de productosNoEncontradosSAP y de las entradas Producto SAP de errorErrors (muta por splice). */
function filtrarFalsosPositivos(productos: string[], errorErrors: ErrorEntry[]): string[] {
  const filtrados = productos.filter(looksLikeProductCode)
  for (let i = errorErrors.length - 1; i >= 0; i--) {
    const err = errorErrors[i]
    if (typeof err !== 'string' && err.campo === 'Producto SAP' && err.producto && !looksLikeProductCode(err.producto)) {
      errorErrors.splice(i, 1)
    }
  }
  return filtrados
}

interface ClasificacionError {
  isSAPError: boolean
  isDuplicateError: boolean
  isFormatError: boolean
  isLongitudError: boolean
  errorCode: string | undefined
}

function clasificarError(e: any, errorMessageStr: string, errorErrors: ErrorEntry[], productos: string[], tiendas: string[], bodegas: string[]): ClasificacionError {
  const lower = errorMessageStr.toLowerCase()

  const isSAPError = productos.length > 0 ||
                     tiendas.length > 0 ||
                     bodegas.length > 0 ||
                     lower.includes('sap') ||
                     lower.includes('no válidos en sap') ||
                     lower.includes('no se encontró')

  const isDuplicateError = (lower.includes('duplicado') ||
                           lower.includes('ya existe en el sistema') ||
                           lower.includes('pedido ya existe') ||
                           lower.includes('número de pedido') && lower.includes('ya existe') ||
                           lower.includes('numero de pedido') && lower.includes('ya existe') ||
                           (e.response?.data?.error_tipo === 'numero_pedido_duplicado')) &&
                           !isSAPError

  const isFormatError = lower.includes('formato') || lower.includes('estructura')

  const errorCode = e.response?.data?.error_code ||
                    e.response?.data?.data?.error_code ||
                    e.response?.data?.error_tipo

  const fromMessageStr = (
    (lower.includes('100') && (lower.includes('caracteres') || lower.includes('carácter'))) ||
    lower.includes('excede los 100') ||
    lower.includes('no puede exceder 100') ||
    lower.includes('máximo 100 caracteres') ||
    lower.includes('máx. 100 caracteres')
  ) && (
    lower.includes('numero_pedido') || lower.includes('número de pedido') || lower.includes('numero de pedido') ||
    lower.includes('mensaje') || lower.includes('campo')
  )
  const fromErroresArray = errorErrors.some(err => {
    if (typeof err !== 'string' && err?.campo != null && err?.mensaje != null) {
      const m = String(err.mensaje).toLowerCase()
      const c = String(err.campo).toLowerCase()
      return (m.includes('100') && (m.includes('caracteres') || m.includes('carácter'))) &&
        (c.includes('numero_pedido') || c.includes('mensaje'))
    }
    return false
  })

  return { isSAPError, isDuplicateError, isFormatError, isLongitudError: fromMessageStr || fromErroresArray, errorCode }
}

function construirMensajeLongitud(errorMessageStr: string, errorErrors: ErrorEntry[]): { title: string; message: string } {
  const lower = errorMessageStr.toLowerCase()
  const camposAfectados: string[] = []
  if (lower.includes('numero_pedido') || lower.includes('número de pedido') || lower.includes('numero de pedido')) {
    camposAfectados.push('Número de pedido')
  }
  if (lower.includes('mensaje')) {
    camposAfectados.push('Mensaje')
  }
  errorErrors.forEach(err => {
    if (typeof err !== 'string' && err?.campo != null) {
      const c = String(err.campo).toLowerCase()
      if (c.includes('numero_pedido') && !camposAfectados.includes('Número de pedido')) {
        camposAfectados.push('Número de pedido')
      }
      if (c.includes('mensaje') && !camposAfectados.includes('Mensaje')) {
        camposAfectados.push('Mensaje')
      }
    }
  })
  if (camposAfectados.length === 0) camposAfectados.push('Número de pedido', 'Mensaje')
  return {
    title: 'Longitud de campo excedida',
    message: `Los siguientes campos no pueden superar los 100 caracteres:\n\n   • ${[...new Set(camposAfectados)].join('\n   • ')}\n\nPor favor, acorte el texto en la plantilla Excel (hoja "cabecera") o en el formulario y vuelva a intentar.`
  }
}

/** Agrega a errorErrors (si faltan) una entrada por cada código no encontrado; devuelve los tipos hallados. */
function agregarEntradasSAP(productos: string[], tiendas: string[], bodegas: string[], errorErrors: ErrorEntry[]): string[] {
  const tiposErrores: string[] = []

  if (productos.length > 0) {
    tiposErrores.push('producto')
    productos.forEach(codigo => {
      const exists = errorErrors.some(err => (typeof err !== 'string') && err.producto === codigo)
      if (!exists) errorErrors.push({ tipo: 'ERROR', campo: 'Producto SAP', mensaje: `El código no existe en SAP`, producto: codigo })
    })
  }

  if (tiendas.length > 0) {
    tiposErrores.push('tienda/bodega')
    tiendas.forEach(codigo => {
      const exists = errorErrors.some(err => (typeof err !== 'string') && err.producto === codigo)
      if (!exists) errorErrors.push({ tipo: 'ERROR', campo: 'Tienda/Bodega SAP', mensaje: `El código no existe en SAP OWHS`, producto: codigo })
    })
  }

  if (bodegas.length > 0) {
    if (!tiposErrores.includes('bodega')) tiposErrores.push('bodega')
    bodegas.forEach(codigo => {
      const exists = errorErrors.some(err => (typeof err !== 'string') && err.producto === codigo)
      if (!exists) errorErrors.push({ tipo: 'ERROR', campo: 'Bodega SAP', mensaje: `El código no existe en SAP OWHS`, producto: codigo })
    })
  }

  return tiposErrores
}

function tituloSAPDesdeTipos(tiposErrores: string[]): string {
  if (tiposErrores.length !== 1) return 'Códigos no válidos en SAP'
  if (tiposErrores[0] === 'producto') return 'Códigos de producto no encontrados en SAP'
  if (tiposErrores[0] === 'tienda/bodega') return 'Códigos de tienda/bodega no encontrados en SAP'
  if (tiposErrores[0] === 'bodega') return 'Códigos de bodega no encontrados en SAP'
  return 'Códigos no válidos en SAP'
}

function mensajeSAPConCodigos(productos: string[], tiendas: string[], bodegas: string[], totalErrores: number): string {
  let errorMessage = `Existen ${totalErrores} código(s) no válidos en SAP.\n\n`
  if (productos.length > 0) {
    errorMessage += `❌ Códigos de PRODUCTO no encontrados (${productos.length}):\n`
    productos.forEach(codigo => { errorMessage += `   • ${codigo}\n` })
    errorMessage += `\n`
  }
  if (tiendas.length > 0) {
    errorMessage += `❌ Códigos de TIENDA/BODEGA no encontrados (${tiendas.length}):\n`
    tiendas.forEach(codigo => { errorMessage += `   • ${codigo}\n` })
    errorMessage += `\n`
  }
  if (bodegas.length > 0) {
    errorMessage += `❌ Códigos de BODEGA no encontrados (${bodegas.length}):\n`
    bodegas.forEach(codigo => { errorMessage += `   • ${codigo}\n` })
    errorMessage += `\n`
  }
  errorMessage += `⚠️ Por favor verifica que estos códigos estén escritos correctamente en el Excel.`
  return errorMessage
}

/**
 * Si no se pudieron extraer códigos con los patrones normales, intenta extraerlos del mensaje del
 * backend directamente buscando la parte después de ":" que parezca contener códigos.
 */
function mensajeSAPFallbackDesdeTexto(errorMessageStr: string, productosPrevios: string[]): { message: string; productos: string[] } {
  if (import.meta.env.DEV) console.log('⚠️ [useFileUpload] No se extrajeron códigos con patrones. Mensaje original:', errorMessageStr)

  const generico = errorMessageStr || `Uno o más códigos del archivo no fueron encontrados en SAP.\n\nVerifica que todos los códigos estén correctamente registrados en SAP.`
  if (!(errorMessageStr && errorMessageStr.includes('no encontrados') && errorMessageStr.includes(':'))) {
    return { message: generico, productos: productosPrevios }
  }

  const partes = errorMessageStr.split(':')
  if (partes.length <= 1) {
    return { message: generico, productos: productosPrevios }
  }

  let codigosParte = ''
  let productosExtraidos = productosPrevios
  for (let i = partes.length - 1; i >= 0; i--) {
    const parte = partes[i].trim()
    if (parte && (parte.includes(',') || parte.split(/\s+/).length > 1)) {
      const posiblesCodigos = parte.split(',').map(c => c.trim()).filter(c => {
        return c && c.length > 0 && !c.match(/^\d+$/) && c.match(/[A-Za-z0-9.-]+/)
      })
      if (posiblesCodigos.length > 0) {
        codigosParte = parte
        productosExtraidos = [...productosPrevios, ...posiblesCodigos]
        break
      }
    }
  }

  if (!codigosParte || productosExtraidos.length === 0) {
    return { message: generico, productos: productosPrevios }
  }

  const productos = [...new Set(productosExtraidos)]
  const totalErrores = productos.length
  const listaProductos = productos.map(c => `   • ${c}`).join('\n')
  const message = `Existen ${totalErrores} código(s) no válidos en SAP.\n\n❌ Códigos de PRODUCTO no encontrados (${productos.length}):\n${listaProductos}\n\n⚠️ Por favor verifica que estos códigos estén escritos correctamente en el Excel.`
  return { message, productos }
}

function construirMensajeSAP(e: any, errorMessageStr: string, errorErrors: ErrorEntry[], productos: string[], tiendas: string[], bodegas: string[]): { title: string; message: string } {
  const tiposErrores = agregarEntradasSAP(productos, tiendas, bodegas, errorErrors)
  const title = tituloSAPDesdeTipos(tiposErrores)

  const totalErrores = productos.length + tiendas.length + bodegas.length
  const sapNoEncontradosCount = e.sapNoEncontradosCount || 0
  const tieneCodigosEspecificos = totalErrores > 0
  const tieneConteoSinCodigos = sapNoEncontradosCount > 0 && !tieneCodigosEspecificos

  if (tieneCodigosEspecificos) {
    const message = mensajeSAPConCodigos(productos, tiendas, bodegas, totalErrores)
    if (import.meta.env.DEV) console.log('✅ [useFileUpload] Mensaje detallado construido:', message)
    return { title, message }
  }
  if (tieneConteoSinCodigos) {
    const message = `Existen ${sapNoEncontradosCount} código(s) de producto no válidos en SAP.\n\n⚠️ Los códigos específicos no están disponibles en la respuesta del servidor.\n\nPor favor, revisa el archivo Excel y verifica que todos los códigos de producto estén escritos correctamente y existan en SAP.`
    if (import.meta.env.DEV) console.log('✅ [useFileUpload] Mensaje detallado construido:', message)
    return { title, message }
  }
  const { message } = mensajeSAPFallbackDesdeTexto(errorMessageStr, productos)
  return { title, message }
}

function construirMensajeDuplicado(e: any, errorMessageStr: string): { title: string; message: string } {
  const numeroPedido = e.response?.data?.numero_pedido ||
                     e.response?.data?.data?.numero_pedido ||
                     errorMessageStr.match(/['"]([^'"]+)['"]/)?.[1] ||
                     errorMessageStr.match(/número de pedido ['"]([^'"]+)['"]/i)?.[1] ||
                     errorMessageStr.match(/numero de pedido ['"]([^'"]+)['"]/i)?.[1]

  const message = numeroPedido
    ? `El número de pedido "${numeroPedido}" ya existe en el sistema.\n\nNo es posible cargar un pedido con un número de pedido duplicado. Por favor, verifica el número de pedido e intenta con un número diferente.`
    : `El número de pedido que intentaste utilizar ya existe en el sistema.\n\nNo es posible cargar un pedido con un número de pedido duplicado. Por favor, verifica el número de pedido e intenta con un número diferente.`

  return { title: 'Número de pedido duplicado', message }
}

interface ContextoTituloYMensaje {
  e: any
  errorMessageStr: string
  errorErrors: ErrorEntry[]
  productos: string[]
  tiendas: string[]
  bodegas: string[]
  clasificacion: ClasificacionError
  errorTitleActual: string
  errorMessageActual: string
}

function construirTituloYMensaje(ctx: ContextoTituloYMensaje): { title: string; message: string } {
  const { e, errorMessageStr, errorErrors, productos, tiendas, bodegas, clasificacion, errorTitleActual, errorMessageActual } = ctx
  const { isSAPError, isDuplicateError, isFormatError, isLongitudError, errorCode } = clasificacion

  if (isLongitudError) {
    return construirMensajeLongitud(errorMessageStr, errorErrors)
  }
  if (errorCode === 'FORMATO_EXCEL_INVALIDO') {
    return { title: 'Formato Excel Inválido', message: `El archivo Excel no contiene la estructura requerida.\n\nEl archivo debe tener las hojas 'cabecera' y 'detalle' con los datos del pedido.\n\n⚠️ Verifica que estés usando la plantilla oficial del sistema.` }
  }
  if (errorCode === 'ARCHIVO_SIN_DATOS') {
    return { title: 'Archivo Sin Datos Válidos', message: `El archivo Excel está vacío o no contiene productos válidos.\n\nEl pedido debe incluir al menos un producto con su información completa.\n\n⚠️ Revisa que la hoja 'detalle' contenga productos y que tengan todos los campos requeridos.` }
  }
  if (errorCode === 'FORMATO_RESPUESTA_PROVEEDOR_INVALIDO') {
    return { title: 'Formato de Respuesta Proveedor Inválido', message: `El archivo de respuesta del proveedor no contiene la hoja requerida.\n\nEl archivo debe incluir una hoja llamada 'RESUMEN'.\n\n⚠️ Solicita al proveedor que use el formato correcto de respuesta.` }
  }
  if (errorCode === 'PACK_PVP_INVALIDOS_SAP') {
    // ⭐ Título deliberadamente sin 'SAP'/'producto' para no activar la detección genérica de
    // isSAPError (códigos no encontrados) más abajo, que tiene un significado distinto (código de
    // producto inexistente vs. valor Pack/PVP incorrecto). errorMessage ya trae el mensaje del backend.
    return { title: 'Discrepancias de Pack/PVP', message: errorMessageActual }
  }
  if (errorCode === 'COSTO_UNITARIO_EXCEL_INCONSISTENTE') {
    // ⭐ La columna "Costo Unitario" de la plantilla no coincide con el valor calculado por el
    // backend (Costo sin IVA x Pack). errorMessage ya trae el detalle por producto del backend.
    return { title: 'Discrepancias de Costo Unitario', message: errorMessageActual }
  }
  if (isSAPError) {
    return construirMensajeSAP(e, errorMessageStr, errorErrors, productos, tiendas, bodegas)
  }
  if (errorCode === 'NUMERO_PEDIDO_DUPLICADO' || isDuplicateError) {
    return construirMensajeDuplicado(e, errorMessageStr)
  }
  if (isFormatError && !errorCode) {
    // Solo usar detección de formato si no hay error_code específico
    return { title: 'Error de formato', message: `El archivo Excel no tiene el formato correcto o está incompleto.\n\nAsegúrate de usar la plantilla oficial y completar todos los campos requeridos.` }
  }
  if (e.isBusinessException) {
    return { title: 'No se puede procesar el archivo', message: errorMessageStr || 'Ocurrió un error de validación de negocio que impide procesar el archivo.' }
  }
  return { title: errorTitleActual, message: errorMessageActual }
}

function extraerMensajeInicial(e: any): string {
  return e.message ||
    e.response?.data?.error ||
    e.response?.data?.message ||
    e.response?.data?.detail ||
    'Error desconocido al subir plantilla'
}

/** numero_pedido del backend, solo cuando el error clasificó como duplicado (para mostrarlo en el modal). */
function extraerNumeroPedidoSiDuplicado(e: any, clasificacion: ClasificacionError): string | undefined {
  if (!(clasificacion.isDuplicateError || clasificacion.errorCode === 'NUMERO_PEDIDO_DUPLICADO')) return undefined
  return e.response?.data?.numero_pedido || e.response?.data?.data?.numero_pedido
}

/**
 * Procesa el error de carga y prepara la información para el modal
 */
export function processUploadError(e: any, fileName: string): UploadErrorInfo {
  const errorTitleInicial = 'Error al cargar plantilla'
  const errorMessageInicial = extraerMensajeInicial(e)
  const errorErrors: ErrorEntry[] = []

  const errorMessageStr = construirMensajeCompletoParaBusqueda(e)
  if (import.meta.env.DEV) console.log('🔍 [useFileUpload] Mensaje completo para búsqueda:', errorMessageStr)

  const estructurado = extraerCodigosFormatoEstructurado(errorMessageStr)
  let productosNoEncontradosSAP = [...estructurado.productos, ...extraerCodigosPatronesLegacy(errorMessageStr, estructurado.productos)]
  let tiendasNoEncontradasSAP = [...estructurado.tiendas]
  let bodegasNoEncontradasSAP = [...estructurado.bodegas]

  if (e.response?.data) {
    const errorData = e.response.data
    const desdeResponseData = extraerDesdeResponseData(errorData, e, errorErrors, productosNoEncontradosSAP)
    productosNoEncontradosSAP.push(...desdeResponseData.productos)
    tiendasNoEncontradasSAP.push(...desdeResponseData.tiendas)
    bodegasNoEncontradasSAP.push(...desdeResponseData.bodegas)
  }

  if (e.errors && Array.isArray(e.errors)) {
    errorErrors.push(...e.errors)
  }

  const errorData = e.response?.data
  productosNoEncontradosSAP = consolidarCodigosEstructurados(errorData, errorErrors, productosNoEncontradosSAP)

  productosNoEncontradosSAP = [...new Set(productosNoEncontradosSAP)]
  tiendasNoEncontradasSAP = [...new Set(tiendasNoEncontradasSAP)]
  bodegasNoEncontradasSAP = [...new Set(bodegasNoEncontradasSAP)]

  productosNoEncontradosSAP = filtrarFalsosPositivos(productosNoEncontradosSAP, errorErrors)

  const clasificacion = clasificarError(e, errorMessageStr, errorErrors, productosNoEncontradosSAP, tiendasNoEncontradasSAP, bodegasNoEncontradasSAP)

  const { title: errorTitle, message: errorMessage } = construirTituloYMensaje({
    e, errorMessageStr, errorErrors, productos: productosNoEncontradosSAP, tiendas: tiendasNoEncontradasSAP, bodegas: bodegasNoEncontradasSAP,
    clasificacion, errorTitleActual: errorTitleInicial, errorMessageActual: errorMessageInicial
  })

  // ⭐ Extraer información de validacion_sap del backend (incluye MBA3 y sugerencias). Busca en
  // múltiples ubicaciones posibles: directamente en data.validacion_sap (formato estándar), o en
  // data.data.validacion_sap (cuando viene de BusinessException con exc.data).
  const validacionSap = e.response?.data?.validacion_sap || e.response?.data?.data?.validacion_sap

  // ⭐ Extraer validacion_pack_pvp del backend (RN-02: discrepancias de Pack/PVP contra SAP).
  // Misma búsqueda dual-path que validacion_sap arriba.
  const validacionPackPvp = e.response?.data?.validacion_pack_pvp || e.response?.data?.data?.validacion_pack_pvp

  const numeroPedidoFromBackend = extraerNumeroPedidoSiDuplicado(e, clasificacion)

  return {
    title: errorTitle,
    message: errorMessage,
    fileName,
    errors: errorErrors.length > 0 ? errorErrors : undefined,
    error_code: clasificacion.errorCode,
    numero_pedido: numeroPedidoFromBackend,
    validacion_sap: validacionSap ? {
      detalle_validacion: validacionSap.detalle_validacion || {}
    } : undefined,
    validacion_pack_pvp: validacionPackPvp ? {
      pack_mismatches: validacionPackPvp.pack_mismatches || [],
      pvp_mismatches: validacionPackPvp.pvp_mismatches || [],
      mensajes: validacionPackPvp.mensajes
    } : undefined
  }
}

/** El backend puede devolver 200 con resultado completo en vez de aceptar el job async (process_id null/vacío, o async:false). */
export function esResultadoInmediatoUpload(accepted: any): boolean {
  return accepted.fallback === 'sync' || accepted.async === false || accepted.process_id == null || accepted.process_id === ''
}

/** 503 de storage/Celery no disponible: no debe reintentarse con el fallback síncrono. */
export function esAsyncStorageUnavailable(asyncErr: any): boolean {
  const errorCode = asyncErr.response?.data?.error ?? asyncErr.response?.data?.detail?.error
  return asyncErr.response?.status === 503 && (errorCode === 'storage_required' || errorCode === 'celery_unavailable')
}

/** numero_pedido puede venir en la raíz o anidado en resultado/result, según el backend. */
export function extraerNumeroPedidoDeRespuesta(response: any): string | undefined {
  return response.numero_pedido ?? response.resultado?.numero_pedido ?? response.result?.numero_pedido
}

/** Arma el detalle de validación SAP (códigos válidos/no encontrados/errores/advertencias) para el toast. */
/** Cuenta un campo de validación SAP que puede venir como array (moderno) o número (legacy). */
function contarCampoSap(items: unknown, totalFallback: number | undefined): number {
  return Array.isArray(items) ? items.length : (totalFallback || (typeof items === 'number' ? items : 0))
}

/** Línea "• Etiqueta (N): a, b, c y M más" (o "• Etiqueta: N" si no hay lista), vacío si count es 0. */
function formatearSeccionSap(etiqueta: string, items: unknown, count: number, maxMostrar: number): string {
  if (count === 0) return ''
  if (Array.isArray(items) && items.length > 0) {
    const extra = items.length > maxMostrar ? ` y ${items.length - maxMostrar} más` : ''
    return `\n  • ${etiqueta} (${count}): ${items.slice(0, maxMostrar).join(', ')}${extra}`
  }
  return `\n  • ${etiqueta}: ${count}`
}

export function construirMensajeDetalleValidacionSap(numeroPedido: string | undefined, response: UploadPlantillaResponse): string {
  let mensajeDetalle = `Número de pedido: ${numeroPedido || 'N/A'}\nArtículos: ${response.articulos_cargados}\nDistribuciones: ${response.distribuciones_cargadas}`

  const sap = response.validacion_sap
  if (!sap) return mensajeDetalle

  mensajeDetalle += `\n\nValidación SAP:`
  mensajeDetalle += `\n  • Códigos válidos: ${sap.validos}/${sap.total_codigos}`

  const noEncontradosCount = contarCampoSap(sap.no_encontrados, sap.total_no_encontrados)
  mensajeDetalle += formatearSeccionSap('No encontrados en SAP', sap.no_encontrados, noEncontradosCount, 5)

  const erroresCount = contarCampoSap(sap.errores, sap.total_errores)
  mensajeDetalle += formatearSeccionSap('Errores', sap.errores, erroresCount, 3)

  const warningsCount = contarCampoSap(sap.warnings, sap.total_warnings)
  mensajeDetalle += formatearSeccionSap('Advertencias', sap.warnings, warningsCount, 3)

  return mensajeDetalle
}

/** Errores del backend que mencionan SAP o "no existe" (para decidir el tipo de toast de éxito). */
export function filtrarErroresSAP(response: UploadPlantillaResponse): any[] {
  return response.errores?.filter((e: any) => {
    if (typeof e === 'string') {
      return e.toLowerCase().includes('sap') || e.toLowerCase().includes('no existe')
    }
    return e.campo === 'CodigoProducto' || (e.mensaje && (e.mensaje.toLowerCase().includes('sap') || e.mensaje.toLowerCase().includes('no existe')))
  }) || []
}

/** Decide nivel/título del toast tras un upload exitoso o con validation_error. null si el status no aplica ninguno de los dos. */
export function determinarToastExito(response: UploadPlantillaResponse, erroresSAP: any[]): { level: 'success' | 'warning'; title: string } | null {
  if (response.status === 'success') {
    if (erroresSAP.length > 0 || (response.validacion_sap && !response.validacion_sap.todos_validos)) {
      return { level: 'warning', title: 'Plantilla procesada con advertencias SAP' }
    }
    return { level: 'success', title: 'Plantilla procesada exitosamente' }
  }
  if (response.status === 'validation_error') {
    if (response.pedido_id) {
      return { level: 'warning', title: 'Plantilla procesada y guardada con advertencias. Revisa el detalle si lo deseas.' }
    }
    return { level: 'warning', title: 'Plantilla procesada con advertencias' }
  }
  return null
}

/** Decide nivel/título/mensaje del toast tras reintentar con correcciones. null si el status no aplica ninguno de los dos. */
export function determinarToastReintento(response: UploadPlantillaResponse, numeroPedido: string | undefined): { level: 'success' | 'warning'; title: string; message: string } | null {
  const message = `Correcciones aplicadas exitosamente.\n\nNúmero de pedido: ${numeroPedido ?? 'N/A'}\nArtículos: ${response.articulos_cargados}\nDistribuciones: ${response.distribuciones_cargadas}`
  if (response.status === 'success') {
    return { level: 'success', title: 'Plantilla procesada con correcciones', message }
  }
  if (response.status === 'validation_error') {
    return { level: 'warning', title: 'Plantilla procesada con advertencias', message }
  }
  return null
}

/** Solo se guarda el archivo original para reintento si el error es de códigos SAP o discrepancia Pack/PVP (RN-02). */
export function debeGuardarArchivoParaReintento(errorInfo: UploadErrorInfo): boolean {
  const esErrorSap = !!(errorInfo.title?.includes('SAP') || errorInfo.title?.includes('producto') || errorInfo.title?.includes('no encontrados'))
  const esErrorPackPvp = !!errorInfo.validacion_pack_pvp
  return esErrorSap || esErrorPackPvp
}

/** Códigos de producto extraídos de errorInfo.errors, para armar el detalle del toast de error. */
export function extraerCodigosDeErrorInfo(errorInfo: UploadErrorInfo): string[] {
  const codigos: string[] = []
  errorInfo.errors?.forEach(err => {
    if (typeof err !== 'string' && err.producto) {
      codigos.push(err.producto)
    }
  })
  return codigos
}

/** Mensaje del toast de error: lista de códigos si hay, si no la primera línea del mensaje. */
export function construirMensajeToastError(errorInfo: UploadErrorInfo, codigos: string[]): string {
  if (codigos.length === 0) return errorInfo.message.split('\n')[0]
  const primeros = codigos.slice(0, 5).join(', ')
  const extra = codigos.length > 5 ? ` y ${codigos.length - 5} más` : ''
  return `Códigos no válidos: ${primeros}${extra}`
}

/** Reemplaza a router.replace/loadPedido segun si el pedido cargado es el mismo que ya se estaba viendo. */
async function redirigirORecargarTrasCarga(
  numeroPedido: string | undefined,
  options: { pedido?: Ref<PedidoCompleto | null>; redirectToCargarPlantilla?: boolean; loadPedido?: () => Promise<void> } | undefined,
  router: ReturnType<typeof useRouter>
): Promise<void> {
  if (!numeroPedido) {
    if (options?.loadPedido) await options.loadPedido()
    return
  }
  const currentPedidoNumero = options?.pedido?.value?.cabecera.numero_pedido
  if (numeroPedido !== currentPedidoNumero) {
    // Si el pedido cargado es diferente al actual, redirigir con replace para no dejar listado en el historial (flujo Celery)
    const pathBase = options?.redirectToCargarPlantilla ? RUTA_CARGAR_PLANTILLA_BASE : RUTA_PEDIDOS_BASE
    await router.replace(`${pathBase}/${encodeURIComponent(numeroPedido)}`)
    await new Promise(resolve => setTimeout(resolve, 100))
    return
  }
  if (options?.loadPedido) await options.loadPedido()
}

export function useFileUpload(options: {
  onUploadSuccess?: (numeroPedido: string, response?: UploadPlantillaResponse) => void | Promise<void>
  onUploadError?: (error: UploadErrorInfo) => void
  loadPedido?: () => Promise<void>
  pedido?: Ref<PedidoCompleto | null>
  /** Si es true, tras subir plantilla redirige a /mba3-consultas/cargar-plantilla/:id en lugar de /mba3-consultas/pedidos/:id */
  redirectToCargarPlantilla?: boolean
  /** Si es true, usa upload-async (Celery): no bloquea la app; requiere Redis + Celery Worker + ENABLE_FILE_STORAGE en backend */
  useAsyncUpload?: boolean
} = {}) {
  const router = useRouter()
  const toast = useToast()

  const uploading = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)
  const showErrorModal = ref(false)
  const uploadErrorInfo = ref<UploadErrorInfo | null>(null)
  // ⭐ NUEVO: Guardar archivo original para posible reintento con correcciones
  const archivoOriginal = ref<File | null>(null)

  /**
   * Unión de todas las correcciones (código y Pack/PVP) elegidas a lo largo de una misma sesión de
   * reintentos, no solo las de la última ronda. El backend es stateless: cada reintento re-sube el
   * Excel original y aplica únicamente lo que llega en esa petición. Como una discrepancia de Pack/PVP
   * de un código no puede validarse hasta que ese código ya esté corregido, el backend puede reportar
   * nuevas discrepancias recién en la ronda siguiente — si esa ronda solo mandara esas discrepancias
   * nuevas (sin repetir las correcciones de código ya elegidas), el backend las volvería a rechazar
   * como códigos inválidos, generando un ciclo de 2 estados que nunca converge. Se resetea al iniciar
   * una carga nueva (uploadFile) y al completarse con éxito.
   */
  const correccionesAcumuladas = ref<CorreccionesPlantilla>({})

  // ⭐ NUEVO: Variables para el progreso de carga
  const uploadProgress = ref(0)
  const uploadFase = ref<'idle' | 'upload' | 'processing' | 'complete'>('idle')
  const uploadMessage = ref('')
  let processingProgressInterval: ReturnType<typeof setInterval> | null = null
  
  /**
   * Actualiza el mensaje de estado según la fase actual
   */
  function updateUploadMessage(fase: 'upload' | 'processing', progress: number) {
    if (fase === 'upload') {
      const uploadPct =
        UPLOAD_PROGRESS_WEIGHT > 0
          ? Math.round((progress / UPLOAD_PROGRESS_WEIGHT) * 100)
          : progress
      uploadMessage.value =
        uploadPct < 50
          ? 'Subiendo archivo al servidor...'
          : 'Finalizando carga del archivo...'
    } else if (!uploadMessage.value || uploadMessage.value === 'Preparando archivo...') {
      if (progress < 45) {
        uploadMessage.value = 'Validando estructura del archivo...'
      } else if (progress < 70) {
        uploadMessage.value = 'Verificando códigos en SAP...'
      } else if (progress < 90) {
        uploadMessage.value = 'Guardando datos del pedido...'
      } else {
        uploadMessage.value = 'Finalizando procesamiento...'
      }
    }
  }

  async function waitForAsyncPlantillaResult(
    processId: string,
    initialMessage: string
  ): Promise<UploadPlantillaResponse> {
    uploadFase.value = 'processing'
    uploadMessage.value = initialMessage
    uploadProgress.value = Math.max(uploadProgress.value, UPLOAD_PROGRESS_WEIGHT)

    const pollResult = await followAsyncJobSseOrPoll(plantillaStreamUrl(processId), {
      pollIntervalMs: PLANTILLA_POLL_INTERVAL_MS,
      maxWaitMs: PLANTILLA_PROCESSING_TIMEOUT_MS,
      maxWaitMessage: SAP_MAY_STILL_PROCESSING_MESSAGE,
      workerPickupTimeoutMs: PLANTILLA_WORKER_PICKUP_TIMEOUT_MS,
      workerNotStartedMessage:
        'El worker de Celery no tomó la plantilla en el tiempo esperado. El procesamiento en segundo plano parece estar detenido.',
      poll: () => pedidosService.getResultadoPlantilla(processId),
      isProcessing: (result) => result.status === 'processing',
      hasWorkerStarted: (result) => {
        if (result.status !== 'processing') return false
        const serverProgress = result.progress ?? 0
        const serverStep = result.step ?? ''
        return serverProgress > 0 || !!(serverStep && serverStep !== 'iniciando')
      },
      getTerminalError: (result) => {
        if (result.status === 'error' && 'error' in result) {
          const err: any = new Error(result.error ?? result.message)
          err.response = { data: result }
          return err
        }
        return null
      },
      onUpdate: (result) => {
        if (result.status !== 'processing') return
        applyPlantillaProcessingUpdate(result, {
          uploadMessage,
          uploadProgress,
        })
      },
    })

    uploadProgress.value = 100
    uploadFase.value = 'complete'
    uploadMessage.value = 'Procesamiento completado'
    await new Promise(resolve => setTimeout(resolve, 400))
    return pollResult as UploadPlantillaResponse
  }
  
  /**
   * Simulación suave solo en upload síncrono (sin progreso del servidor durante el POST).
   * Avanza de 25% a 92% como indicador visual; el 100% llega al recibir la respuesta HTTP.
   */
  function startProcessingProgressSimulation() {
    if (processingProgressInterval) {
      clearInterval(processingProgressInterval)
    }

    uploadFase.value = 'processing'
    let currentProgress = Math.max(uploadProgress.value, UPLOAD_PROGRESS_WEIGHT)

    processingProgressInterval = setInterval(() => {
      if (currentProgress < PROCESSING_SIMULATION_CAP) {
        let increment: number
        if (currentProgress < 50) increment = 2
        else if (currentProgress < 75) increment = 1
        else increment = 0.5
        currentProgress = Math.min(PROCESSING_SIMULATION_CAP, currentProgress + increment)
        uploadProgress.value = Math.round(currentProgress)
        updateUploadMessage('processing', currentProgress)
      }
    }, PROCESSING_PROGRESS_INTERVAL_MS)
  }
  
  /**
   * Detiene la simulación de progreso y marca como completado
   */
  function stopProcessingProgressSimulation(success: boolean = true) {
    if (processingProgressInterval) {
      clearInterval(processingProgressInterval)
      processingProgressInterval = null
    }
    
    if (success) {
      uploadProgress.value = 100
      uploadFase.value = 'complete'
      uploadMessage.value = 'Procesamiento completado'
    }
  }
  
  /**
   * Reinicia el estado de progreso
   */
  function resetProgress() {
    uploadProgress.value = 0
    uploadFase.value = 'idle'
    uploadMessage.value = ''
    if (processingProgressInterval) {
      clearInterval(processingProgressInterval)
      processingProgressInterval = null
    }
  }

  /**
   * Valida un archivo antes de subirlo
   */
  function validateFile(file: File): { valid: boolean; error?: string } {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension as any)) {
      return { valid: false, error: `Solo se permiten archivos Excel (${ALLOWED_FILE_EXTENSIONS.join(', ')})` }
    }
    
    if (file.size > MAX_EXCEL_UPLOAD_SIZE_BYTES) {
      return { valid: false, error: `El tamaño máximo es ${MAX_EXCEL_UPLOAD_SIZE_MB} MB` }
    }
    
    return { valid: true }
  }

  /**
   * Abre el selector de archivos
   */
  function openFileSelector() {
    // Bloquear doble subida accidental
    if (uploading.value) return
    
    // Crear input de archivo dinámico si no existe
    if (!fileInput.value) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = ALLOWED_FILE_EXTENSIONS.join(',')
      input.style.display = 'none'
      input.addEventListener('change', (event) => handleFileSelect(event))
      document.body.appendChild(input)
      fileInput.value = input as any
    }
    
    // Abrir selector directamente
    if (fileInput.value) {
      fileInput.value.click()
    }
  }

  /**
   * Maneja la selección de archivo
   */
  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    if (!target.files || target.files.length === 0) return
    
    const file = target.files[0]
    
    // Validar archivo
    const validation = validateFile(file)
    if (!validation.valid) {
      toast.error('Error de validación', validation.error ?? 'Archivo no válido')
      // Limpiar input
      if (target) target.value = ''
      return
    }
    
    // Mostrar confirmación rápida
    toast.info(
      `Archivo seleccionado: ${file.name}`,
      'Subiendo archivo...',
      2000
    )
    
    // Subir automáticamente
    await uploadFile(file)
    
    // Limpiar input después de procesar
    if (target) target.value = ''
  }


  function handleUploadProgress(progress: number, fase: 'upload' | 'processing') {
    if (fase === 'upload') {
      const normalizedUploadPct = options?.useAsyncUpload
        ? progress
        : Math.min(100, Math.round((progress / 70) * 100))
      uploadProgress.value = mapFileUploadProgress(normalizedUploadPct)
      uploadFase.value = 'upload'
      updateUploadMessage('upload', uploadProgress.value)
      if (!options?.useAsyncUpload && progress >= 70) {
        startProcessingProgressSimulation()
      }
    } else if (fase === 'processing') {
      stopProcessingProgressSimulation(true)
    }
  }

  /** Sube el archivo (async con polling, o su fallback inmediato) o el flujo sincrono clasico segun useAsyncUpload. */
  async function realizarSubida(file: File): Promise<UploadPlantillaResponse> {
    if (!options?.useAsyncUpload) {
      return await pedidosService.uploadPlantilla(file, handleUploadProgress)
    }
    try {
      const accepted = await pedidosService.uploadPlantillaAsync(file, {}, handleUploadProgress)
      // Backend puede devolver 200 con resultado completo (fallback sync: process_id null, async false) — no hacer polling
      if (!esResultadoInmediatoUpload(accepted)) {
        return await waitForAsyncPlantillaResult(
          accepted.process_id!,
          accepted.message ?? 'Procesando plantilla en segundo plano...'
        )
      }
      stopProcessingProgressSimulation(true)
      uploadProgress.value = 100
      uploadFase.value = 'complete'
      uploadMessage.value = 'Procesamiento completado'
      await new Promise(r => setTimeout(r, 400))
      return normalizeValidationResponse(accepted as any) as UploadPlantillaResponse
    } catch (asyncErr: any) {
      if (esAsyncStorageUnavailable(asyncErr)) {
        if (import.meta.env.DEV) console.warn('[useFileUpload] Async no disponible (503); no se usará fallback síncrono')
      }
      throw asyncErr
    }
  }

  /**
   * Sube un archivo al servidor (síncrono o async según useAsyncUpload)
   */
  /** Fallback cuando la respuesta de subida no trae numero_pedido: lo busca vía el pedido_id. */
  async function obtenerNumeroPedidoPorId(pedidoId: string): Promise<string | undefined> {
    try {
      const pedidoCompleto = await pedidosService.getPedido(pedidoId, false)
      return pedidoCompleto.cabecera.numero_pedido ?? undefined
    } catch (e) {
      console.warn('No se pudo obtener el numero_pedido del pedido cargado:', e)
      return undefined
    }
  }

  /** Toast + resaltado + callback + redirect tras una subida (inicial) exitosa o con advertencias. */
  async function manejarExitoUpload(response: UploadPlantillaResponse, numeroPedido: string | undefined): Promise<void> {
    const mensajeDetalle = construirMensajeDetalleValidacionSap(numeroPedido, response)
    const erroresSAP = filtrarErroresSAP(response)
    const toastExito = determinarToastExito(response, erroresSAP)
    if (toastExito) {
      toast[toastExito.level](toastExito.title, mensajeDetalle)
    }

    // Guardar correcciones en sessionStorage antes de redirect para que la vista de destino pueda resaltar (flujo async)
    if (numeroPedido) {
      saveCorreccionesParaResaltado(numeroPedido, response)
    }

    // Llamar callback de éxito si existe
    if (numeroPedido && options?.onUploadSuccess) {
      await options.onUploadSuccess(numeroPedido, response)
    }

    // Redirigir o recargar según corresponda
    await redirigirORecargarTrasCarga(numeroPedido, options, router)
  }

  async function uploadFile(file: File) {
    uploading.value = true
    resetProgress()
    uploadFase.value = 'upload'
    uploadMessage.value = 'Preparando archivo...'
    // Nueva carga (no un reintento con correcciones): arranca una sesión nueva, sin arrastrar
    // correcciones acumuladas de un intento anterior con otro archivo.
    correccionesAcumuladas.value = {}

    try {
      const response = await realizarSubida(file)

      // Pedido guardado: success o validation_error con pedido_id (backend puede devolver 200 con advertencias)
      const pedidoGuardado = response.status === 'success' || (response.pedido_id && response.status === 'validation_error')

      // ⭐ Limpiar archivo original si la carga fue exitosa (incl. guardado con advertencias)
      if (pedidoGuardado) {
        archivoOriginal.value = null
      }

      let numeroPedido = extraerNumeroPedidoDeRespuesta(response)

      // Si no viene en la respuesta, intentar obtenerlo del pedido cargado usando pedido_id (necesario para redirigir)
      if (!numeroPedido && response.pedido_id) {
        numeroPedido = await obtenerNumeroPedidoPorId(response.pedido_id)
      }

      await manejarExitoUpload(response, numeroPedido)
    } catch (e: any) {
      // ⭐ Detener simulación de progreso en caso de error
      stopProcessingProgressSimulation(false)
      
      const errorInfo = processUploadError(e, file.name)
      uploadErrorInfo.value = errorInfo
      showErrorModal.value = true

      // ⭐ Guardar archivo original para posible reintento con correcciones
      if (debeGuardarArchivoParaReintento(errorInfo)) {
        archivoOriginal.value = file
        if (import.meta.env.DEV) console.log('💾 [useFileUpload] Archivo original guardado para posible reintento con correcciones')
      }

      const todosLosCodigos = extraerCodigosDeErrorInfo(errorInfo)
      toast.error(errorInfo.title ?? 'Error', construirMensajeToastError(errorInfo, todosLosCodigos))

      if (options?.onUploadError) {
        options.onUploadError(errorInfo)
      }
    } finally {
      uploading.value = false
      // ⭐ Pequeño delay antes de resetear el progreso para que el usuario vea el 100%
      setTimeout(() => {
        resetProgress()
      }, 500)
    }
  }
  
  /**
   * ⭐ Reintenta la carga del archivo con correcciones de código de producto aplicadas (en
   * segundo plano, async). Las discrepancias de Pack/PVP (RN-02) son siempre bloqueantes y no
   * tienen corrección aplicable aquí — se corrigen fuera del sistema y se vuelve a subir el Excel.
   * Usa upload-async + polling igual que la primera subida.
   */
  function handleCorreccionesProgress(progress: number, fase: 'upload' | 'processing') {
    if (fase === 'upload') {
      uploadProgress.value = mapFileUploadProgress(progress)
      uploadFase.value = 'upload'
      updateUploadMessage('upload', uploadProgress.value)
    } else if (fase === 'processing') {
      stopProcessingProgressSimulation(true)
    }
  }

  /** Sube el archivo con las correcciones acumuladas (upload-async + polling), con su propio fallback 503. */
  async function subirConCorreccionesAsync(file: File): Promise<UploadPlantillaResponse> {
    try {
      // ⭐ Subir con correcciones en segundo plano (upload-async + Celery)
      const accepted = await pedidosService.uploadPlantillaAsync(
        file,
        { correcciones_codigos: correccionesAcumuladas.value.correccionesCodigos },
        handleCorreccionesProgress
      )
      if (esResultadoInmediatoUpload(accepted)) {
        stopProcessingProgressSimulation(true)
        uploadProgress.value = 100
        uploadFase.value = 'complete'
        uploadMessage.value = 'Procesamiento completado'
        await new Promise(r => setTimeout(r, 400))
        return normalizeValidationResponse(accepted as any) as UploadPlantillaResponse
      }
      return await waitForAsyncPlantillaResult(
        accepted.process_id!,
        accepted.message ?? 'Aplicando correcciones en segundo plano...'
      )
    } catch (asyncErr: any) {
      if (esAsyncStorageUnavailable(asyncErr)) {
        if (import.meta.env.DEV) console.warn('[useFileUpload] Async no disponible (503); no se usará fallback síncrono con correcciones')
      }
      throw asyncErr
    }
  }

  /** Toast + resaltado + callback + redirect tras un reintento con correcciones exitoso o con advertencias. */
  async function manejarExitoReintento(response: UploadPlantillaResponse, numeroPedido: string | undefined): Promise<void> {
    const toastReintento = determinarToastReintento(response, numeroPedido)
    if (toastReintento) {
      toast[toastReintento.level](toastReintento.title, toastReintento.message)
    }

    // Guardar correcciones en sessionStorage antes de redirect para que la vista muestre el resaltado (flujo async)
    if (numeroPedido) {
      saveCorreccionesParaResaltado(numeroPedido, response)
    }

    if (numeroPedido && options?.onUploadSuccess) {
      if (import.meta.env.DEV) console.log('[useFileUpload] reintentarConCorrecciones éxito, response:', { hasCorrecciones: !!(response as any).correcciones_aplicadas?.length, keys: Object.keys(response || {}) })
      await options.onUploadSuccess(numeroPedido, response)
    }

    await redirigirORecargarTrasCarga(numeroPedido, options, router)
  }

  function manejarErrorReintento(e: any, file: File): void {
    const errorInfo = processUploadError(e, file.name)
    uploadErrorInfo.value = errorInfo
    showErrorModal.value = true

    toast.error(
      'Error al aplicar correcciones',
      errorInfo.message.split('\n')[0] || 'No se pudo procesar el archivo con las correcciones aplicadas'
    )

    if (options?.onUploadError) {
      options.onUploadError(errorInfo)
    }
  }

  async function reintentarConCorrecciones(
    file: File,
    correcciones: CorreccionesPlantilla
  ): Promise<void> {
    if (!file) {
      throw new Error('Archivo no disponible para reintento')
    }

    // Acumular con lo ya corregido en rondas anteriores de esta misma sesión (ver comentario en la
    // declaración de correccionesAcumuladas): el backend es stateless y solo aplica lo que llega en
    // esta petición, así que hay que reenviar la unión completa, no solo lo nuevo de esta ronda.
    correccionesAcumuladas.value = {
      correccionesCodigos: { ...correccionesAcumuladas.value.correccionesCodigos, ...correcciones.correccionesCodigos }
    }

    const tieneCodigos = !!correccionesAcumuladas.value.correccionesCodigos && Object.keys(correccionesAcumuladas.value.correccionesCodigos).length > 0
    if (!tieneCodigos) {
      throw new Error('No se proporcionaron correcciones')
    }

    uploading.value = true
    resetProgress()
    uploadFase.value = 'upload'
    uploadMessage.value = 'Preparando archivo con correcciones...'

    try {
      const response = await subirConCorreccionesAsync(file)

      archivoOriginal.value = null
      // Sesión de correcciones cerrada con éxito: no debe arrastrarse al siguiente archivo que se suba.
      correccionesAcumuladas.value = {}

      let numeroPedido = extraerNumeroPedidoDeRespuesta(response)
      if (!numeroPedido && response.pedido_id && options?.pedido?.value) {
        numeroPedido = await obtenerNumeroPedidoPorId(response.pedido_id)
      }

      await manejarExitoReintento(response, numeroPedido)
    } catch (e: any) {
      stopProcessingProgressSimulation(false)
      manejarErrorReintento(e, file)
      throw e
    } finally {
      uploading.value = false
      setTimeout(() => {
        resetProgress()
      }, 500)
    }
  }

  // Cleanup al desmontar
  onUnmounted(() => {
    if (fileInput.value) {
      fileInput.value.remove()
      fileInput.value = null
    }
    // ⭐ Limpiar intervalo de progreso si existe
    if (processingProgressInterval) {
      clearInterval(processingProgressInterval)
    }
  })

  return {
    uploading,
    showErrorModal,
    uploadErrorInfo,
    openFileSelector,
    uploadFile,
    validateFile,
    reintentarConCorrecciones,
    archivoOriginal,
    // ⭐ NUEVO: Exportar variables de progreso
    uploadProgress,
    uploadFase,
    uploadMessage
  }
}
