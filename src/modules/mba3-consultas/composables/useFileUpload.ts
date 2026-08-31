/**
 * Composable para manejar la carga de archivos Excel (plantillas)
 * ⭐ Con soporte para progreso de carga y procesamiento
 */
import { ref, Ref } from '@vue/reactivity'
import { onUnmounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { MAX_EXCEL_UPLOAD_SIZE_BYTES, MAX_EXCEL_UPLOAD_SIZE_MB } from '@/config/uploadLimits'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
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

/**
 * Procesa el error de carga y prepara la información para el modal
 */
export function processUploadError(e: any, fileName: string): UploadErrorInfo {
  let errorTitle = 'Error al cargar plantilla'
  // Obtener mensaje de error de múltiples fuentes posibles
  let errorMessage = e.message || 
                    e.response?.data?.error || 
                    e.response?.data?.message || 
                    e.response?.data?.detail ||
                    'Error desconocido al subir plantilla'
  const errorErrors: Array<string | { tipo?: string; campo?: string; mensaje: string; producto?: string }> = []
  let productosNoEncontradosSAP: string[] = []
  let tiendasNoEncontradasSAP: string[] = []
  let bodegasNoEncontradasSAP: string[] = []

  // Construir string de mensaje completo para búsqueda de patrones
  // Combinar todos los posibles mensajes en un solo string para buscar patrones
  // Eliminar duplicados usando Set
  const mensajesUnicos = new Set([
    e.message,
    e.response?.data?.error,
    e.response?.data?.message,
    e.response?.data?.detail,
    e.response?.data?.data?.error,
    e.response?.data?.data?.message
  ].filter(Boolean))
  const errorMessageStr = Array.from(mensajesUnicos).join(' ') || ''
  
  if (import.meta.env.DEV) console.log('🔍 [useFileUpload] Mensaje completo para búsqueda:', errorMessageStr)
  
  // ✅ NUEVO: Extraer códigos del formato estructurado del backend
  // Formato: "❌ Códigos NO ENCONTRADOS en SAP (N):\n   • CODIGO1\n   • CODIGO2\n..."
  const codigosNoEncontradosMatch = errorMessageStr.match(/❌ Códigos (?:de )?(PRODUCTO|TIENDA|BODEGA|NO ENCONTRADOS)[\s\S]*?\((?:[^)]+)\):\s*\n((?:\s*•\s*[^\n]+\n?)+)/gi)
  if (codigosNoEncontradosMatch) {
    for (const section of codigosNoEncontradosMatch) {
      // Extraer tipo (PRODUCTO, TIENDA, BODEGA)
      const tipoMatch = section.match(/Códigos (?:de )?(PRODUCTO|TIENDA|BODEGA|NO ENCONTRADOS)/i)
      const tipo = tipoMatch ? tipoMatch[1] : 'NO ENCONTRADOS'
      
      // Extraer códigos (líneas que empiezan con "   •")
      const codigosMatch = section.match(/\s*•\s*([^\n]+)/g)
      if (codigosMatch) {
        const codigos = codigosMatch.map(line => line.replace(/^\s*•\s*/, '').trim()).filter(c => c)
        
        if (tipo.includes('PRODUCTO')) {
          productosNoEncontradosSAP.push(...codigos)
        } else if (tipo.includes('TIENDA')) {
          tiendasNoEncontradasSAP.push(...codigos)
        } else if (tipo.includes('BODEGA')) {
          bodegasNoEncontradasSAP.push(...codigos)
        } else {
          // Si no especifica tipo, asumir que pueden ser tiendas/bodegas (formato genérico)
          tiendasNoEncontradasSAP.push(...codigos)
        }
      }
    }
  }
  
  // ✅ También extraer códigos del formato antiguo (compatibilidad)
  // Patrón para: "❌ Validación SAP productos falló: Productos no encontrados (N): CODIGO1, CODIGO2"
  // También puede venir en múltiples líneas o como parte de un mensaje más largo
  const validacionSapPatterns = [
    // Patrón específico para el formato exacto del backend
    /❌\s*Validación\s+SAP\s+productos?\s+falló:\s*Productos?\s+no\s+encontrados?\s*\([^)]*\):\s*([A-Za-z0-9,.\s-]+)/i,
    /Validación\s+SAP\s+productos?\s+falló:\s*Productos?\s+no\s+encontrados?\s*\([^)]*\):\s*([A-Za-z0-9,.\s-]+)/i,
    // Patrón más flexible que busca "Productos no encontrados (N):" seguido de códigos
    /Productos?\s+no\s+encontrados?\s*\([^)]*\):\s*([A-Za-z0-9,.\s-]+)/i,
    // Patrón alternativo sin paréntesis
    /Productos?\s+no\s+encontrados?\s+en\s+SAP[^:]*:\s*([A-Za-z0-9,.\s-]+)/i
  ]
  
  for (const pattern of validacionSapPatterns) {
    const match = errorMessageStr.match(pattern)
    if (match && match[1]) {
      const codigos = match[1].split(',').map(c => c.trim()).filter(c => c && c.length > 0 && !c.match(/^\d+$/))
      if (codigos.length > 0) {
        productosNoEncontradosSAP.push(...codigos)
        break // Solo usar el primer patrón que coincida
      }
    }
  }
  
  // Si aún no se encontraron códigos, buscar en todo el mensaje cualquier patrón de códigos después de ":"
  if (productosNoEncontradosSAP.length === 0 && errorMessageStr.includes(':')) {
    // Buscar la última parte después de ":" que contenga códigos separados por comas
    const partes = errorMessageStr.split(':')
    if (partes.length > 1) {
      const ultimaParte = partes[partes.length - 1].trim()
      // Verificar si la última parte parece contener códigos (tiene comas o múltiples palabras)
      if (ultimaParte.includes(',') || ultimaParte.split(/\s+/).length > 1) {
        const posiblesCodigos = ultimaParte.split(',').map(c => c.trim()).filter(c => {
          // Filtrar solo códigos que parezcan válidos (no solo números, no vacíos)
          return c && c.length > 0 && !c.match(/^\d+$/) && c.match(/[A-Za-z0-9.-]+/)
        })
        if (posiblesCodigos.length > 0) {
          productosNoEncontradosSAP.push(...posiblesCodigos)
          if (import.meta.env.DEV) console.log('✅ [useFileUpload] Códigos extraídos de la última parte del mensaje:', posiblesCodigos)
        }
      }
    }
  }
  
  const sapErrorPatterns = [
    /Productos no encontrados en SAP:\s*([A-Za-z0-9,.\s-]+)/i,
    /no válidos en SAP[^:]*:\s*([A-Za-z0-9,.\s-]+)/i,
    /No se encontró información en SAP para SKU:\s*([A-Za-z0-9,.\s-]+)/i,
    // Patrón adicional para formato: "Productos no encontrados (N): CODIGO1, CODIGO2"
    /Productos?\s+no\s+encontrados?\s*\([^)]*\):\s*([A-Za-z0-9,.\s-]+)/i
  ]
  
  for (const pattern of sapErrorPatterns) {
    const match = errorMessageStr.match(pattern)
    if (match && match[1]) {
      const codigos = match[1].split(',').map(c => c.trim()).filter(c => c)
      productosNoEncontradosSAP.push(...codigos)
    }
  }

  // Intentar extraer información detallada del error response
  if (e.response?.data) {
    const errorData = e.response.data
    
    if (errorData.errores && Array.isArray(errorData.errores)) {
      errorErrors.push(...errorData.errores)
    }
    
    if (errorData.validacion) {
      const validacion = errorData.validacion
      
      // ✅ Productos no encontrados
      if (validacion.productos?.no_encontrados?.length > 0) {
        const noEncontrados = Array.isArray(validacion.productos.no_encontrados) 
          ? validacion.productos.no_encontrados 
          : []
        noEncontrados.forEach((codigo: string) => {
          errorErrors.push({
            tipo: 'ERROR',
            campo: 'Producto SAP',
            mensaje: `El código no existe en SAP`,
            producto: codigo
          })
          if (!productosNoEncontradosSAP.includes(codigo)) {
            productosNoEncontradosSAP.push(codigo)
          }
        })
      }
      
      // ✅ Tiendas no encontradas
      if (validacion.tiendas?.no_encontradas?.length > 0) {
        const noEncontradas = Array.isArray(validacion.tiendas.no_encontradas)
          ? validacion.tiendas.no_encontradas
          : []
        noEncontradas.forEach((codigo: string) => {
          errorErrors.push({
            tipo: 'ERROR',
            campo: 'Tienda/Bodega SAP',
            mensaje: `El código no existe en SAP OWHS`,
            producto: codigo
          })
          if (!tiendasNoEncontradasSAP.includes(codigo)) {
            tiendasNoEncontradasSAP.push(codigo)
          }
        })
      }
      
      // ✅ Bodegas no encontradas
      if (validacion.bodegas?.no_encontradas?.length > 0) {
        const noEncontradas = Array.isArray(validacion.bodegas.no_encontradas)
          ? validacion.bodegas.no_encontradas
          : []
        noEncontradas.forEach((codigo: string) => {
          errorErrors.push({
            tipo: 'ERROR',
            campo: 'Bodega SAP',
            mensaje: `El código no existe en SAP OWHS`,
            producto: codigo
          })
          if (!bodegasNoEncontradasSAP.includes(codigo)) {
            bodegasNoEncontradasSAP.push(codigo)
          }
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
    }
    
    // ✅ Extraer códigos desde validacion_sap estructurado
    if (errorData.validacion_sap) {
      const sap = errorData.validacion_sap
      
      // ⭐ MEJORADO: El backend ahora siempre envía arrays de códigos
      if (Array.isArray(sap.no_encontrados)) {
        sap.no_encontrados.forEach((codigo: string) => {
          if (!productosNoEncontradosSAP.includes(codigo)) {
            productosNoEncontradosSAP.push(codigo)
          }
        })
      } else if (typeof sap.no_encontrados === 'number' && sap.no_encontrados > 0) {
        // ⭐ COMPATIBILIDAD: Si el backend aún envía número (formato antiguo), buscar en otros campos
        // Buscar en validacion.productos.no_encontrados como fallback
        if (errorData.validacion?.productos?.no_encontrados && Array.isArray(errorData.validacion.productos.no_encontrados) && errorData.validacion.productos.no_encontrados.length > 0) {
          errorData.validacion.productos.no_encontrados.forEach((codigo: string) => {
            if (!productosNoEncontradosSAP.includes(codigo)) {
              productosNoEncontradosSAP.push(codigo)
            }
          })
        }
        
        // Si aún no tenemos códigos específicos, usar el conteo para el mensaje
        if (productosNoEncontradosSAP.length === 0) {
          ;(e as any).sapNoEncontradosCount = sap.no_encontrados
        }
      }
      
      // ⭐ MEJORADO: Manejar errores de SAP (ahora también es array)
      if (Array.isArray(sap.errores) && sap.errores.length > 0) {
        sap.errores.forEach((errorMsg: string) => {
          errorErrors.push({
            tipo: 'ERROR',
            campo: 'ValidacionSAP',
            mensaje: errorMsg,
            producto: undefined
          })
        })
      } else if (typeof sap.errores === 'number' && sap.errores > 0) {
        // Compatibilidad con formato antiguo
        errorErrors.push({
          tipo: 'ERROR',
          campo: 'ValidacionSAP',
          mensaje: `${sap.no_encontrados?.length || sap.total_no_encontrados || 0} código(s) no encontrado(s) en SAP, ${sap.errores} error(es)`,
          producto: undefined
        })
      }
    }
    
    // ✅ Extraer códigos desde data estructurado (BusinessException)
    // BusinessException puede tener la estructura: { type: 'business_exception', error: '...', data: { validacion: {...}, validacion_sap: {...} } }
    if (import.meta.env.DEV) console.log('🔍 [useFileUpload] Verificando errorData.data:', errorData.data)
    
    // ⭐ NUEVO: También buscar validacion_sap en errorData.data (BusinessException)
    if (errorData.data?.validacion_sap) {
      const sapData = errorData.data.validacion_sap
      if (import.meta.env.DEV) console.log('✅ [useFileUpload] Encontrada validacion_sap en errorData.data.validacion_sap:', sapData)
      
      // Extraer códigos no encontrados
      if (Array.isArray(sapData.no_encontrados)) {
        sapData.no_encontrados.forEach((codigo: string) => {
          if (!productosNoEncontradosSAP.includes(codigo)) {
            productosNoEncontradosSAP.push(codigo)
          }
        })
      }
    }
    
    if (errorData.data?.validacion) {
      const validacion = errorData.data.validacion
      if (import.meta.env.DEV) console.log('✅ [useFileUpload] Encontrada validacion en errorData.data.validacion:', validacion)
      
      // Productos
      if (validacion.productos?.no_encontrados && Array.isArray(validacion.productos.no_encontrados)) {
        validacion.productos.no_encontrados.forEach((codigo: string) => {
          if (!productosNoEncontradosSAP.includes(codigo)) {
            productosNoEncontradosSAP.push(codigo)
          }
        })
      }
      
      // Tiendas
      if (validacion.tiendas?.no_encontradas && Array.isArray(validacion.tiendas.no_encontradas)) {
        validacion.tiendas.no_encontradas.forEach((codigo: string) => {
          if (!tiendasNoEncontradasSAP.includes(codigo)) {
            tiendasNoEncontradasSAP.push(codigo)
          }
        })
      }
      
      // Bodegas
      if (validacion.bodegas?.no_encontradas && Array.isArray(validacion.bodegas.no_encontradas)) {
        validacion.bodegas.no_encontradas.forEach((codigo: string) => {
          if (!bodegasNoEncontradasSAP.includes(codigo)) {
            bodegasNoEncontradasSAP.push(codigo)
          }
        })
      }
    }
  }

  if ((e as any).errors && Array.isArray((e as any).errors)) {
    errorErrors.push(...(e as any).errors)
  }

  // ⭐ Si el backend envió validacion_sap/validacion con no_encontrados, usar SOLO esos códigos
  // (evitar falsos positivos del parsing del mensaje: "Existen códigos...", "Existen c", etc.)
  const errorData = e.response?.data
  const structuredNoEncontrados: string[] = [
    ...(Array.isArray(errorData?.validacion_sap?.no_encontrados) ? errorData.validacion_sap.no_encontrados : []),
    ...(Array.isArray(errorData?.validacion?.productos?.no_encontrados) ? errorData.validacion.productos.no_encontrados : []),
    ...(Array.isArray(errorData?.data?.validacion_sap?.no_encontrados) ? errorData.data.validacion_sap.no_encontrados : []),
    ...(Array.isArray(errorData?.data?.validacion?.productos?.no_encontrados) ? errorData.data.validacion.productos.no_encontrados : [])
  ]
  if (structuredNoEncontrados.length > 0) {
    productosNoEncontradosSAP = [...new Set(structuredNoEncontrados)]
    // Quitar entradas "Producto SAP" que no estén en la lista real (eran del parsing del mensaje)
    for (let i = errorErrors.length - 1; i >= 0; i--) {
      const err = errorErrors[i]
      if (typeof err !== 'string' && err.campo === 'Producto SAP' && err.producto && !productosNoEncontradosSAP.includes(err.producto)) {
        errorErrors.splice(i, 1)
      }
    }
    // Asegurar una entrada por cada código real
    const existingProductos = new Set(
      (errorErrors.filter(er => typeof er !== 'string' && er.campo === 'Producto SAP') as Array<{ producto?: string }>).map(er => er.producto)
    )
    productosNoEncontradosSAP.forEach(codigo => {
      if (!existingProductos.has(codigo)) {
        errorErrors.push({ tipo: 'ERROR', campo: 'Producto SAP', mensaje: 'El código no existe en SAP', producto: codigo })
      }
    })
  }

  // Eliminar duplicados de los códigos extraídos
  productosNoEncontradosSAP = [...new Set(productosNoEncontradosSAP)]
  tiendasNoEncontradasSAP = [...new Set(tiendasNoEncontradasSAP)]
  bodegasNoEncontradasSAP = [...new Set(bodegasNoEncontradasSAP)]

  // ⭐ Filtrar falsos positivos: mensajes de error (formato, etc.) no son códigos de producto SAP
  const looksLikeProductCode = (s: string): boolean => {
    if (!s || typeof s !== 'string' || s.length > 35) return false
    const lower = s.toLowerCase()
    if (lower.includes('formato') || lower.includes('archivo') || lower.includes('excel') || lower.includes('estructura') || lower.includes('hoja') || lower.includes('cabecera') || lower.includes('detalle') || lower.includes('requerida')) return false
    return /^[A-Za-z0-9.\s-]+$/.test(s.trim())
  }
  productosNoEncontradosSAP = productosNoEncontradosSAP.filter(looksLikeProductCode)
  for (let i = errorErrors.length - 1; i >= 0; i--) {
    const err = errorErrors[i]
    if (typeof err !== 'string' && err.campo === 'Producto SAP' && err.producto && !looksLikeProductCode(err.producto)) {
      errorErrors.splice(i, 1)
    }
  }

  // Identificar el tipo de error
  const isSAPError = productosNoEncontradosSAP.length > 0 || 
                     tiendasNoEncontradasSAP.length > 0 ||
                     bodegasNoEncontradasSAP.length > 0 ||
                     errorMessageStr.toLowerCase().includes('sap') ||
                     errorMessageStr.toLowerCase().includes('no válidos en sap') ||
                     errorMessageStr.toLowerCase().includes('no se encontró')
  
  const isDuplicateError = (errorMessageStr.toLowerCase().includes('duplicado') ||
                           errorMessageStr.toLowerCase().includes('ya existe en el sistema') ||
                           errorMessageStr.toLowerCase().includes('pedido ya existe') ||
                           errorMessageStr.toLowerCase().includes('número de pedido') && errorMessageStr.toLowerCase().includes('ya existe') ||
                           errorMessageStr.toLowerCase().includes('numero de pedido') && errorMessageStr.toLowerCase().includes('ya existe') ||
                           (e.response?.data?.error_tipo === 'numero_pedido_duplicado')) &&
                           !isSAPError
  
  const isFormatError = errorMessageStr.toLowerCase().includes('formato') ||
                        errorMessageStr.toLowerCase().includes('estructura')

  // ⭐ NUEVO: Extraer error_code del backend para títulos específicos
  const errorCode = e.response?.data?.error_code || 
                    e.response?.data?.data?.error_code ||
                    e.response?.data?.error_tipo

  // ⭐ Validación de longitud: numero_pedido y mensaje permiten hasta 100 caracteres
  const lower = errorMessageStr.toLowerCase()
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
  const isLongitudError = fromMessageStr || fromErroresArray
  if (isLongitudError) {
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
    errorTitle = 'Longitud de campo excedida'
    errorMessage = `Los siguientes campos no pueden superar los 100 caracteres:\n\n   • ${[...new Set(camposAfectados)].join('\n   • ')}\n\nPor favor, acorte el texto en la plantilla Excel (hoja "cabecera") o en el formulario y vuelva a intentar.`
  } else if (errorCode === 'FORMATO_EXCEL_INVALIDO') {
    errorTitle = 'Formato Excel Inválido'
    errorMessage = `El archivo Excel no contiene la estructura requerida.\n\nEl archivo debe tener las hojas 'cabecera' y 'detalle' con los datos del pedido.\n\n⚠️ Verifica que estés usando la plantilla oficial del sistema.`
  } else if (errorCode === 'ARCHIVO_SIN_DATOS') {
    errorTitle = 'Archivo Sin Datos Válidos'
    errorMessage = `El archivo Excel está vacío o no contiene productos válidos.\n\nEl pedido debe incluir al menos un producto con su información completa.\n\n⚠️ Revisa que la hoja 'detalle' contenga productos y que tengan todos los campos requeridos.`
  } else if (errorCode === 'FORMATO_RESPUESTA_PROVEEDOR_INVALIDO') {
    errorTitle = 'Formato de Respuesta Proveedor Inválido'
    errorMessage = `El archivo de respuesta del proveedor no contiene la hoja requerida.\n\nEl archivo debe incluir una hoja llamada 'RESUMEN'.\n\n⚠️ Solicita al proveedor que use el formato correcto de respuesta.`
  } else if (errorCode === 'PACK_PVP_INVALIDOS_SAP') {
    // ⭐ NUEVO: Discrepancias de Pack/PVP contra SAP (RN-02). Título deliberadamente sin 'SAP'/'producto'
    // para no activar la detección genérica de isSAPError (códigos no encontrados) más abajo,
    // que tiene un significado distinto (código de producto inexistente vs. valor Pack/PVP incorrecto).
    errorTitle = 'Discrepancias de Pack/PVP'
    // errorMessage ya contiene el mensaje del backend (asignado al inicio de la función)
  } else if (errorCode === 'COSTO_UNITARIO_EXCEL_INCONSISTENTE') {
    // ⭐ NUEVO: la columna "Costo Unitario" de la plantilla no coincide con el valor que el
    // backend calcula a partir de "Costo sin IVA" y el Pack (fórmula de esa celda mal aplicada,
    // ej. referencia a la fila incorrecta). errorMessage ya trae el detalle por producto
    // (asignado al inicio de la función); solo se personaliza el título.
    errorTitle = 'Discrepancias de Costo Unitario'
  } else if (isSAPError) {
    // ✅ Determinar si es producto, tienda o bodega
    const totalErrores = productosNoEncontradosSAP.length + tiendasNoEncontradasSAP.length + bodegasNoEncontradasSAP.length
    const tiposErrores: string[] = []
    
    // Agregar productos a errores detallados
    if (productosNoEncontradosSAP.length > 0) {
      tiposErrores.push('producto')
      productosNoEncontradosSAP.forEach(codigo => {
        const exists = errorErrors.some(err => 
          (typeof err !== 'string') && err.producto === codigo
        )
        if (!exists) {
          errorErrors.push({
            tipo: 'ERROR',
            campo: 'Producto SAP',
            mensaje: `El código no existe en SAP`,
            producto: codigo
          })
        }
      })
    }
    
    // Agregar tiendas a errores detallados
    if (tiendasNoEncontradasSAP.length > 0) {
      tiposErrores.push('tienda/bodega')
      tiendasNoEncontradasSAP.forEach(codigo => {
        const exists = errorErrors.some(err => 
          (typeof err !== 'string') && err.producto === codigo
        )
        if (!exists) {
          errorErrors.push({
            tipo: 'ERROR',
            campo: 'Tienda/Bodega SAP',
            mensaje: `El código no existe en SAP OWHS`,
            producto: codigo
          })
        }
      })
    }
    
    // Agregar bodegas a errores detallados
    if (bodegasNoEncontradasSAP.length > 0) {
      if (!tiposErrores.includes('bodega')) {
        tiposErrores.push('bodega')
      }
      bodegasNoEncontradasSAP.forEach(codigo => {
        const exists = errorErrors.some(err => 
          (typeof err !== 'string') && err.producto === codigo
        )
        if (!exists) {
          errorErrors.push({
            tipo: 'ERROR',
            campo: 'Bodega SAP',
            mensaje: `El código no existe en SAP OWHS`,
            producto: codigo
          })
        }
      })
    }
    
    // ✅ Título dinámico según los tipos de errores encontrados
    if (tiposErrores.length === 1) {
      if (tiposErrores[0] === 'producto') {
        errorTitle = 'Códigos de producto no encontrados en SAP'
      } else if (tiposErrores[0] === 'tienda/bodega') {
        errorTitle = 'Códigos de tienda/bodega no encontrados en SAP'
      } else if (tiposErrores[0] === 'bodega') {
        errorTitle = 'Códigos de bodega no encontrados en SAP'
      }
    } else {
      errorTitle = 'Códigos no válidos en SAP'
    }
    
    // ✅ Construir mensaje estructurado con todos los códigos
    // SIEMPRE construir mensaje detallado si hay códigos extraídos, sin importar el mensaje del backend
    const sapNoEncontradosCount = (e as any).sapNoEncontradosCount || 0
    const tieneCodigosEspecificos = totalErrores > 0
    const tieneConteoSinCodigos = sapNoEncontradosCount > 0 && !tieneCodigosEspecificos
    
    if (tieneCodigosEspecificos || tieneConteoSinCodigos) {
      if (tieneCodigosEspecificos) {
        // Tenemos códigos específicos - mostrar lista detallada
        errorMessage = `Existen ${totalErrores} código(s) no válidos en SAP.\n\n`
        
        if (productosNoEncontradosSAP.length > 0) {
          errorMessage += `❌ Códigos de PRODUCTO no encontrados (${productosNoEncontradosSAP.length}):\n`
          productosNoEncontradosSAP.forEach(codigo => {
            errorMessage += `   • ${codigo}\n`
          })
          errorMessage += `\n`
        }
        
        if (tiendasNoEncontradasSAP.length > 0) {
          errorMessage += `❌ Códigos de TIENDA/BODEGA no encontrados (${tiendasNoEncontradasSAP.length}):\n`
          tiendasNoEncontradasSAP.forEach(codigo => {
            errorMessage += `   • ${codigo}\n`
          })
          errorMessage += `\n`
        }
        
        if (bodegasNoEncontradasSAP.length > 0) {
          errorMessage += `❌ Códigos de BODEGA no encontrados (${bodegasNoEncontradasSAP.length}):\n`
          bodegasNoEncontradasSAP.forEach(codigo => {
            errorMessage += `   • ${codigo}\n`
          })
          errorMessage += `\n`
        }
        
        errorMessage += `⚠️ Por favor verifica que estos códigos estén escritos correctamente en el Excel.`
      } else if (tieneConteoSinCodigos) {
        // No tenemos códigos específicos pero sí el conteo - mostrar mensaje informativo
        errorMessage = `Existen ${sapNoEncontradosCount} código(s) de producto no válidos en SAP.\n\n`
        errorMessage += `⚠️ Los códigos específicos no están disponibles en la respuesta del servidor.\n\n`
        errorMessage += `Por favor, revisa el archivo Excel y verifica que todos los códigos de producto estén escritos correctamente y existan en SAP.`
      }
      
      if (import.meta.env.DEV) console.log('✅ [useFileUpload] Mensaje detallado construido:', errorMessage)
    } else {
      // Si no se pudieron extraer códigos con los patrones, intentar extraerlos del mensaje del backend directamente
      // El mensaje del backend puede tener formato: "❌ Validación SAP productos falló: Productos no encontrados (2): R225.1012.BCO.10-12, R5082-17.1012896"
      if (import.meta.env.DEV) console.log('⚠️ [useFileUpload] No se extrajeron códigos con patrones. Mensaje original:', errorMessageStr)
      
      if (errorMessageStr && errorMessageStr.includes('no encontrados') && errorMessageStr.includes(':')) {
        // Intentar extraer la parte después de los dos puntos que contiene los códigos
        const partes = errorMessageStr.split(':')
        if (partes.length > 1) {
          // Buscar la parte que contiene códigos (generalmente la última o penúltima)
          let codigosParte = ''
          // Revisar desde el final hacia atrás para encontrar la parte con códigos
          for (let i = partes.length - 1; i >= 0; i--) {
            const parte = partes[i].trim()
            // Verificar si esta parte parece contener códigos (tiene comas o múltiples palabras/códigos)
            if (parte && (parte.includes(',') || parte.split(/\s+/).length > 1)) {
              const posiblesCodigos = parte.split(',').map(c => c.trim()).filter(c => {
                return c && c.length > 0 && !c.match(/^\d+$/) && c.match(/[A-Za-z0-9.-]+/)
              })
              if (posiblesCodigos.length > 0) {
                codigosParte = parte
                productosNoEncontradosSAP.push(...posiblesCodigos)
                break
              }
            }
          }
          
          if (codigosParte && productosNoEncontradosSAP.length > 0) {
            // Eliminar duplicados
            productosNoEncontradosSAP = [...new Set(productosNoEncontradosSAP)]
            // Reconstruir el mensaje detallado con los códigos extraídos
            const totalErrores = productosNoEncontradosSAP.length
            errorMessage = `Existen ${totalErrores} código(s) no válidos en SAP.\n\n❌ Códigos de PRODUCTO no encontrados (${productosNoEncontradosSAP.length}):\n${productosNoEncontradosSAP.map(c => `   • ${c}`).join('\n')}\n\n⚠️ Por favor verifica que estos códigos estén escritos correctamente en el Excel.`
          } else {
            // Si no se pudieron extraer códigos, usar el mensaje del backend directamente
            errorMessage = errorMessageStr || `Uno o más códigos del archivo no fueron encontrados en SAP.\n\nVerifica que todos los códigos estén correctamente registrados en SAP.`
          }
        } else {
          errorMessage = errorMessageStr || `Uno o más códigos del archivo no fueron encontrados en SAP.\n\nVerifica que todos los códigos estén correctamente registrados en SAP.`
        }
      } else {
        // Si no se pudieron extraer códigos, usar el mensaje del backend directamente
        errorMessage = errorMessageStr || `Uno o más códigos del archivo no fueron encontrados en SAP.\n\nVerifica que todos los códigos estén correctamente registrados en SAP.`
      }
    }
  } else if (errorCode === 'NUMERO_PEDIDO_DUPLICADO' || isDuplicateError) {
    errorTitle = 'Número de pedido duplicado'
    // ⭐ MEJORADO: Primero intentar obtener el número de pedido del backend
    let numeroPedido = e.response?.data?.numero_pedido || 
                       e.response?.data?.data?.numero_pedido ||
                       // Extraer del mensaje si está disponible
                       errorMessageStr.match(/['"]([^'"]+)['"]/)?.[1] || 
                       errorMessageStr.match(/número de pedido ['"]([^'"]+)['"]/i)?.[1] ||
                       errorMessageStr.match(/numero de pedido ['"]([^'"]+)['"]/i)?.[1]
    
    if (numeroPedido) {
      errorMessage = `El número de pedido "${numeroPedido}" ya existe en el sistema.\n\nNo es posible cargar un pedido con un número de pedido duplicado. Por favor, verifica el número de pedido e intenta con un número diferente.`
    } else {
      errorMessage = `El número de pedido que intentaste utilizar ya existe en el sistema.\n\nNo es posible cargar un pedido con un número de pedido duplicado. Por favor, verifica el número de pedido e intenta con un número diferente.`
    }
  } else if (isFormatError && !errorCode) {
    // Solo usar detección de formato si no hay error_code específico
    errorTitle = 'Error de formato'
    errorMessage = `El archivo Excel no tiene el formato correcto o está incompleto.\n\nAsegúrate de usar la plantilla oficial y completar todos los campos requeridos.`
  } else if ((e as any).isBusinessException) {
    errorTitle = 'No se puede procesar el archivo'
    errorMessage = errorMessageStr || 'Ocurrió un error de validación de negocio que impide procesar el archivo.'
  }
  
  // ⭐ NUEVO: Extraer información de validacion_sap del backend (incluye MBA3 y sugerencias)
  // Buscar en múltiples ubicaciones posibles (BusinessException puede tener diferentes estructuras)
  // 1. Directamente en data.validacion_sap (formato estándar)
  // 2. En data.data.validacion_sap (cuando viene de BusinessException con exc.data)
  const validacionSap = e.response?.data?.validacion_sap || e.response?.data?.data?.validacion_sap

  // ⭐ NUEVO: Extraer validacion_pack_pvp del backend (RN-02: discrepancias de Pack/PVP contra SAP)
  // Misma búsqueda dual-path que validacion_sap arriba (BusinessException puede anidar un nivel más)
  const validacionPackPvp = e.response?.data?.validacion_pack_pvp || e.response?.data?.data?.validacion_pack_pvp

  // ⭐ NUEVO: Extraer numero_pedido si es un error de duplicado
  const numeroPedidoFromBackend = (isDuplicateError || errorCode === 'NUMERO_PEDIDO_DUPLICADO') ? (
    e.response?.data?.numero_pedido ||
    e.response?.data?.data?.numero_pedido
  ) : undefined

  return {
    title: errorTitle,
    message: errorMessage,
    fileName,
    errors: errorErrors.length > 0 ? errorErrors : undefined,
    // ⭐ NUEVO: Código de error específico
    error_code: errorCode,
    // ⭐ NUEVO: Número de pedido (si es error de duplicado)
    numero_pedido: numeroPedidoFromBackend,
    // ⭐ Incluir validacion_sap completa del backend
    validacion_sap: validacionSap ? {
      detalle_validacion: validacionSap.detalle_validacion || {}
    } : undefined,
    // ⭐ NUEVO: Incluir validacion_pack_pvp completa del backend (RN-02)
    validacion_pack_pvp: validacionPackPvp ? {
      pack_mismatches: validacionPackPvp.pack_mismatches || [],
      pvp_mismatches: validacionPackPvp.pvp_mismatches || [],
      mensajes: validacionPackPvp.mensajes
    } : undefined
  }
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
      poll: () => mba3ConsultasService.getResultadoPlantilla(processId),
      isProcessing: (result) => result.status === 'processing',
      hasWorkerStarted: (result) => {
        if (result.status !== 'processing') return false
        const estado = result as PlantillaProcesoEstado
        const serverProgress = estado.progress ?? 0
        const serverStep = estado.step ?? ''
        return serverProgress > 0 || !!(serverStep && serverStep !== 'iniciando')
      },
      getTerminalError: (result) => {
        if (result.status === 'error' && 'error' in result) {
          const err: any = new Error(
            (result as PlantillaProcesoEstado).error || (result as PlantillaProcesoEstado).message
          )
          err.response = { data: result }
          return err
        }
        return null
      },
      onUpdate: (result) => {
        if (result.status !== 'processing') return
        applyPlantillaProcessingUpdate(result as PlantillaProcesoEstado, {
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
        const increment = currentProgress < 50 ? 2 : currentProgress < 75 ? 1 : 0.5
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
      toast.error('Error de validación', validation.error || 'Archivo no válido')
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


  /**
   * Sube un archivo al servidor (síncrono o async según useAsyncUpload)
   */
  async function uploadFile(file: File) {
    uploading.value = true
    resetProgress()
    uploadFase.value = 'upload'
    uploadMessage.value = 'Preparando archivo...'
    // Nueva carga (no un reintento con correcciones): arranca una sesión nueva, sin arrastrar
    // correcciones acumuladas de un intento anterior con otro archivo.
    correccionesAcumuladas.value = {}

    try {
      const handleProgress = (progress: number, fase: 'upload' | 'processing') => {
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
      
      let response: UploadPlantillaResponse

      if (options?.useAsyncUpload) {
        try {
          const accepted = await mba3ConsultasService.uploadPlantillaAsync(file, {}, handleProgress)
          // Backend puede devolver 200 con resultado completo (fallback sync: process_id null, async false) — no hacer polling
          const isResultadoInmediato = (accepted as any).fallback === 'sync' || accepted.async === false || accepted.process_id == null || accepted.process_id === ''
          if (isResultadoInmediato) {
            stopProcessingProgressSimulation(true)
            uploadProgress.value = 100
            uploadFase.value = 'complete'
            uploadMessage.value = 'Procesamiento completado'
            await new Promise(r => setTimeout(r, 400))
            response = normalizeValidationResponse(accepted as any) as UploadPlantillaResponse
          } else {
            response = await waitForAsyncPlantillaResult(
              accepted.process_id!,
              accepted.message || 'Procesando plantilla en segundo plano...'
            )
          }
        } catch (asyncErr: any) {
          const errorCode = asyncErr.response?.data?.error ?? asyncErr.response?.data?.detail?.error
          const is503Unavailable = asyncErr.response?.status === 503 &&
            (errorCode === 'storage_required' || errorCode === 'celery_unavailable')
          if (is503Unavailable) {
            if (import.meta.env.DEV) console.warn('[useFileUpload] Async no disponible (503); no se usará fallback síncrono')
          }
          throw asyncErr
        }
      } else {
        response = await mba3ConsultasService.uploadPlantilla(file, handleProgress)
      }
      
      // Pedido guardado: success o validation_error con pedido_id (backend puede devolver 200 con advertencias)
      const pedidoGuardado = response.status === 'success' || (response.pedido_id && response.status === 'validation_error')

      // ⭐ Limpiar archivo original si la carga fue exitosa (incl. guardado con advertencias)
      if (pedidoGuardado) {
        archivoOriginal.value = null
      }
      
      // Obtener numero_pedido de la respuesta (puede venir en la raíz o en resultado, según backend)
      const resAny = response as any
      let numeroPedido = response.numero_pedido ?? resAny.resultado?.numero_pedido ?? resAny.result?.numero_pedido
      
      // Si no viene en la respuesta, intentar obtenerlo del pedido cargado usando pedido_id (necesario para redirigir)
      if (!numeroPedido && response.pedido_id) {
        try {
          const pedidoCompleto = await mba3ConsultasService.getPedido(response.pedido_id, false)
          numeroPedido = pedidoCompleto.cabecera.numero_pedido || undefined
        } catch (e) {
          console.warn('No se pudo obtener el numero_pedido del pedido cargado:', e)
        }
      }
      
      // Mostrar resultado con información de validación SAP si existe
      let mensajeDetalle = `Número de pedido: ${numeroPedido || 'N/A'}\nArtículos: ${response.articulos_cargados}\nDistribuciones: ${response.distribuciones_cargadas}`
      
      if (response.validacion_sap) {
        const sap = response.validacion_sap
        mensajeDetalle += `\n\nValidación SAP:`
        mensajeDetalle += `\n  • Códigos válidos: ${sap.validos}/${sap.total_codigos}`
        
        // ⭐ MEJORADO: Manejar arrays de códigos
        const noEncontradosCount = Array.isArray(sap.no_encontrados) 
          ? sap.no_encontrados.length 
          : (sap.total_no_encontrados || (typeof sap.no_encontrados === 'number' ? sap.no_encontrados : 0))
        
        if (noEncontradosCount > 0) {
          if (Array.isArray(sap.no_encontrados) && sap.no_encontrados.length > 0) {
            mensajeDetalle += `\n  • No encontrados en SAP (${noEncontradosCount}): ${sap.no_encontrados.slice(0, 5).join(', ')}${sap.no_encontrados.length > 5 ? ` y ${sap.no_encontrados.length - 5} más` : ''}`
          } else {
            mensajeDetalle += `\n  • No encontrados en SAP: ${noEncontradosCount}`
          }
        }
        
        const erroresCount = Array.isArray(sap.errores) 
          ? sap.errores.length 
          : (sap.total_errores || (typeof sap.errores === 'number' ? sap.errores : 0))
        
        if (erroresCount > 0) {
          if (Array.isArray(sap.errores) && sap.errores.length > 0) {
            mensajeDetalle += `\n  • Errores (${erroresCount}): ${sap.errores.slice(0, 3).join(', ')}${sap.errores.length > 3 ? ` y ${sap.errores.length - 3} más` : ''}`
          } else {
            mensajeDetalle += `\n  • Errores: ${erroresCount}`
          }
        }
        
        const warningsCount = Array.isArray(sap.warnings) 
          ? sap.warnings.length 
          : (sap.total_warnings || (typeof sap.warnings === 'number' ? sap.warnings : 0))
        
        if (warningsCount > 0) {
          if (Array.isArray(sap.warnings) && sap.warnings.length > 0) {
            mensajeDetalle += `\n  • Advertencias (${warningsCount}): ${sap.warnings.slice(0, 3).join(', ')}${sap.warnings.length > 3 ? ` y ${sap.warnings.length - 3} más` : ''}`
          } else {
            mensajeDetalle += `\n  • Advertencias: ${warningsCount}`
          }
        }
      }
      
      const erroresSAP = response.errores?.filter((e: any) => {
        if (typeof e === 'string') {
          return e.toLowerCase().includes('sap') || e.toLowerCase().includes('no existe')
        }
        return e.campo === 'CodigoProducto' || (e.mensaje && (e.mensaje.toLowerCase().includes('sap') || e.mensaje.toLowerCase().includes('no existe')))
      }) || []
      
      if (response.status === 'success') {
        if (erroresSAP.length > 0 || (response.validacion_sap && !response.validacion_sap.todos_validos)) {
          toast.warning('Plantilla procesada con advertencias SAP', mensajeDetalle)
        } else {
          toast.success('Plantilla procesada exitosamente', mensajeDetalle)
        }
      } else if (response.status === 'validation_error') {
        if (response.pedido_id) {
          toast.warning(
            'Plantilla procesada y guardada con advertencias. Revisa el detalle si lo deseas.',
            mensajeDetalle
          )
        } else {
          toast.warning('Plantilla procesada con advertencias', mensajeDetalle)
        }
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
      if (numeroPedido) {
        const currentPedidoNumero = options?.pedido?.value?.cabecera.numero_pedido
        const pathBase = options?.redirectToCargarPlantilla ? RUTA_CARGAR_PLANTILLA_BASE : RUTA_PEDIDOS_BASE
        if (numeroPedido !== currentPedidoNumero) {
          // Si el pedido cargado es diferente al actual, redirigir con replace para no dejar listado en el historial (flujo Celery)
          await router.replace(`${pathBase}/${encodeURIComponent(numeroPedido)}`)
          await new Promise(resolve => setTimeout(resolve, 100))
        } else {
          // Recargar el pedido actual si hay callback
          if (options?.loadPedido) {
            await options.loadPedido()
          }
        }
      } else {
        // Si no hay numeroPedido pero hay callback, intentar recargar
        if (options?.loadPedido) {
          await options.loadPedido()
        }
      }
    } catch (e: any) {
      // ⭐ Detener simulación de progreso en caso de error
      stopProcessingProgressSimulation(false)
      
      const errorInfo = processUploadError(e, file.name)
      uploadErrorInfo.value = errorInfo
      showErrorModal.value = true
      
      // ⭐ Guardar archivo original para posible reintento con correcciones
      // Solo si el error es de códigos no válidos en SAP, o de discrepancias de Pack/PVP (RN-02)
      const esErrorSap = errorInfo.title?.includes('SAP') || errorInfo.title?.includes('producto') || errorInfo.title?.includes('no encontrados')
      const esErrorPackPvp = !!errorInfo.validacion_pack_pvp
      if (esErrorSap || esErrorPackPvp) {
        archivoOriginal.value = file
        if (import.meta.env.DEV) console.log('💾 [useFileUpload] Archivo original guardado para posible reintento con correcciones')
      }
      
      // Extraer todos los códigos para el toast
      const todosLosCodigos: string[] = []
      errorInfo.errors?.forEach(err => {
        if (typeof err !== 'string' && err.producto) {
          todosLosCodigos.push(err.producto)
        }
      })
      
      toast.error(
        errorInfo.title || 'Error',
        todosLosCodigos.length > 0 
          ? `Códigos no válidos: ${todosLosCodigos.slice(0, 5).join(', ')}${todosLosCodigos.length > 5 ? ` y ${todosLosCodigos.length - 5} más` : ''}`
          : errorInfo.message.split('\n')[0]
      )
      
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
      const handleProgress = (progress: number, fase: 'upload' | 'processing') => {
        if (fase === 'upload') {
          uploadProgress.value = mapFileUploadProgress(progress)
          uploadFase.value = 'upload'
          updateUploadMessage('upload', uploadProgress.value)
        } else if (fase === 'processing') {
          stopProcessingProgressSimulation(true)
        }
      }

      let response: UploadPlantillaResponse

      try {
        // ⭐ Subir con correcciones en segundo plano (upload-async + Celery)
        const accepted = await mba3ConsultasService.uploadPlantillaAsync(
          file,
          { correcciones_codigos: correccionesAcumuladas.value.correccionesCodigos },
          handleProgress
        )
        // Backend puede devolver 200 con resultado completo (fallback sync: process_id null, async false) — no hacer polling
        const isResultadoInmediato = (accepted as any).fallback === 'sync' || accepted.async === false || accepted.process_id == null || accepted.process_id === ''
        if (isResultadoInmediato) {
          stopProcessingProgressSimulation(true)
          uploadProgress.value = 100
          uploadFase.value = 'complete'
          uploadMessage.value = 'Procesamiento completado'
          await new Promise(r => setTimeout(r, 400))
          response = normalizeValidationResponse(accepted as any) as UploadPlantillaResponse
        } else {
          response = await waitForAsyncPlantillaResult(
            accepted.process_id!,
            accepted.message || 'Aplicando correcciones en segundo plano...'
          )
        }
      } catch (asyncErr: any) {
        const errorCode = asyncErr.response?.data?.error ?? asyncErr.response?.data?.detail?.error
        const is503Unavailable = asyncErr.response?.status === 503 &&
          (errorCode === 'storage_required' || errorCode === 'celery_unavailable')
        if (is503Unavailable) {
          if (import.meta.env.DEV) console.warn('[useFileUpload] Async no disponible (503); no se usará fallback síncrono con correcciones')
        }
        throw asyncErr
      }

      archivoOriginal.value = null
      // Sesión de correcciones cerrada con éxito: no debe arrastrarse al siguiente archivo que se suba.
      correccionesAcumuladas.value = {}

      const resAnyReintento = response as any
      let numeroPedido = response.numero_pedido ?? resAnyReintento.resultado?.numero_pedido ?? resAnyReintento.result?.numero_pedido
      if (!numeroPedido && response.pedido_id && options?.pedido?.value) {
        try {
          const pedidoCompleto = await mba3ConsultasService.getPedido(response.pedido_id, false)
          numeroPedido = pedidoCompleto.cabecera.numero_pedido || undefined
        } catch (e) {
          console.warn('No se pudo obtener el numero_pedido del pedido cargado:', e)
        }
      }

      const mensajeDetalle = `Correcciones aplicadas exitosamente.\n\nNúmero de pedido: ${numeroPedido || 'N/A'}\nArtículos: ${response.articulos_cargados}\nDistribuciones: ${response.distribuciones_cargadas}`

      if (response.status === 'success') {
        toast.success('Plantilla procesada con correcciones', mensajeDetalle)
      } else if (response.status === 'validation_error') {
        toast.warning('Plantilla procesada con advertencias', mensajeDetalle)
      }

      // Guardar correcciones en sessionStorage antes de redirect para que la vista muestre el resaltado (flujo async)
      if (numeroPedido) {
        saveCorreccionesParaResaltado(numeroPedido, response)
      }

      if (numeroPedido && options?.onUploadSuccess) {
        if (import.meta.env.DEV) console.log('[useFileUpload] reintentarConCorrecciones éxito, response:', { hasCorrecciones: !!(response as any).correcciones_aplicadas?.length, keys: Object.keys(response || {}) })
        await options.onUploadSuccess(numeroPedido, response)
      }

      if (numeroPedido) {
        const currentPedidoNumero = options?.pedido?.value?.cabecera.numero_pedido
        const pathBase = options?.redirectToCargarPlantilla ? RUTA_CARGAR_PLANTILLA_BASE : RUTA_PEDIDOS_BASE
        if (numeroPedido !== currentPedidoNumero) {
          // Tras aplicar correcciones: redirigir con replace (flujo Celery)
          await router.replace(`${pathBase}/${encodeURIComponent(numeroPedido)}`)
          await new Promise(resolve => setTimeout(resolve, 100))
        } else {
          if (options?.loadPedido) {
            await options.loadPedido()
          }
        }
      } else {
        if (options?.loadPedido) {
          await options.loadPedido()
        }
      }
    } catch (e: any) {
      stopProcessingProgressSimulation(false)

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
