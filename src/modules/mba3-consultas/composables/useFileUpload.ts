/**
 * Composable para manejar la carga de archivos Excel (plantillas)
 * ⭐ Con soporte para progreso de carga y procesamiento
 */
import { ref, Ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { UploadPlantillaResponse, PedidoCompleto } from '../types'

// Constantes de configuración
const ALLOWED_FILE_EXTENSIONS = ['.xlsx', '.xls'] as const
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
// ⭐ Intervalo para simulación de progreso durante procesamiento del servidor
const PROCESSING_PROGRESS_INTERVAL_MS = 500

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
}

export function useFileUpload(options: {
  onUploadSuccess?: (numeroPedido: string, response?: UploadPlantillaResponse) => void | Promise<void>
  onUploadError?: (error: UploadErrorInfo) => void
  loadPedido?: () => Promise<void>
  pedido?: Ref<PedidoCompleto | null>
  /** Si es true, tras subir plantilla redirige a /mba3-consultas/cargar-plantilla/:id en lugar de /mba3-consultas/pedidos/:id */
  redirectToCargarPlantilla?: boolean
} = {}) {
  const router = useRouter()
  const toast = useToast()

  const uploading = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)
  const showErrorModal = ref(false)
  const uploadErrorInfo = ref<UploadErrorInfo | null>(null)
  // ⭐ NUEVO: Guardar archivo original para posible reintento con correcciones
  const archivoOriginal = ref<File | null>(null)
  
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
      uploadMessage.value = progress < 50 
        ? 'Subiendo archivo al servidor...' 
        : 'Finalizando carga del archivo...'
    } else {
      if (progress < 80) {
        uploadMessage.value = 'Validando estructura del archivo...'
      } else if (progress < 90) {
        uploadMessage.value = 'Verificando códigos en SAP...'
      } else if (progress < 95) {
        uploadMessage.value = 'Guardando datos del pedido...'
      } else {
        uploadMessage.value = 'Finalizando procesamiento...'
      }
    }
  }
  
  /**
   * Inicia la simulación de progreso durante el procesamiento del servidor
   * El progreso va de 70% a 95% mientras esperamos la respuesta
   */
  function startProcessingProgressSimulation() {
    // Limpiar intervalo anterior si existe
    if (processingProgressInterval) {
      clearInterval(processingProgressInterval)
    }
    
    uploadFase.value = 'processing'
    let currentProgress = 70
    
    processingProgressInterval = setInterval(() => {
      // Incrementar progreso gradualmente hasta 95%
      if (currentProgress < 95) {
        // Incremento más lento a medida que se acerca al 95%
        const increment = currentProgress < 85 ? 2 : (currentProgress < 92 ? 1 : 0.5)
        currentProgress = Math.min(95, currentProgress + increment)
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
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `El tamaño máximo es ${MAX_FILE_SIZE_MB} MB` }
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
   * Procesa el error de carga y prepara la información para el modal
   */
  function processUploadError(e: any, fileName: string): UploadErrorInfo {
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

    // Eliminar duplicados de los códigos extraídos
    productosNoEncontradosSAP = [...new Set(productosNoEncontradosSAP)]
    tiendasNoEncontradasSAP = [...new Set(tiendasNoEncontradasSAP)]
    bodegasNoEncontradasSAP = [...new Set(bodegasNoEncontradasSAP)]

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
    
    // ⭐ MEJORADO: Títulos específicos basados en error_code
    if (errorCode === 'FORMATO_EXCEL_INVALIDO') {
      errorTitle = 'Formato Excel Inválido'
      errorMessage = `El archivo Excel no contiene la estructura requerida.\n\nEl archivo debe tener las hojas 'cabecera' y 'detalle' con los datos del pedido.\n\n⚠️ Verifica que estés usando la plantilla oficial del sistema.`
    } else if (errorCode === 'ARCHIVO_SIN_DATOS') {
      errorTitle = 'Archivo Sin Datos Válidos'
      errorMessage = `El archivo Excel está vacío o no contiene productos válidos.\n\nEl pedido debe incluir al menos un producto con su información completa.\n\n⚠️ Revisa que la hoja 'detalle' contenga productos y que tengan todos los campos requeridos.`
    } else if (errorCode === 'FORMATO_RESPUESTA_PROVEEDOR_INVALIDO') {
      errorTitle = 'Formato de Respuesta Proveedor Inválido'
      errorMessage = `El archivo de respuesta del proveedor no contiene la hoja requerida.\n\nEl archivo debe incluir una hoja llamada 'RESUMEN'.\n\n⚠️ Solicita al proveedor que use el formato correcto de respuesta.`
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
      } : undefined
    }
  }

  /**
   * Sube un archivo al servidor
   */
  async function uploadFile(file: File) {
    uploading.value = true
    resetProgress()
    uploadFase.value = 'upload'
    uploadMessage.value = 'Preparando archivo...'
    
    try {
      // ⭐ Callback para actualizar el progreso
      const handleProgress = (progress: number, fase: 'upload' | 'processing') => {
        if (fase === 'upload') {
          uploadProgress.value = progress
          uploadFase.value = 'upload'
          updateUploadMessage('upload', progress)
          
          // Cuando el upload llega al 70%, iniciar simulación de procesamiento
          if (progress >= 70) {
            startProcessingProgressSimulation()
          }
        } else if (fase === 'processing') {
          // La respuesta llegó, detener simulación y marcar como completado
          stopProcessingProgressSimulation(true)
        }
      }
      
      const response: UploadPlantillaResponse = await mba3ConsultasService.uploadPlantilla(file, handleProgress)
      
      // ⭐ Limpiar archivo original si la carga fue exitosa
      if (response.status === 'success') {
        archivoOriginal.value = null
      }
      
      // Obtener numero_pedido de la respuesta
      let numeroPedido = response.numero_pedido
      
      // Si no viene en la respuesta, intentar obtenerlo del pedido cargado usando pedido_id
      if (!numeroPedido && response.pedido_id && options?.pedido?.value) {
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
        toast.warning('Plantilla procesada con advertencias', mensajeDetalle)
      }
      
      // Llamar callback de éxito si existe
      if (numeroPedido && options?.onUploadSuccess) {
        await options.onUploadSuccess(numeroPedido, response)
      }
      
      // Redirigir o recargar según corresponda
      if (numeroPedido) {
        const currentPedidoNumero = options?.pedido?.value?.cabecera.numero_pedido
        const pathBase = options?.redirectToCargarPlantilla ? '/mba3-consultas/cargar-plantilla' : '/mba3-consultas/pedidos'
        if (numeroPedido !== currentPedidoNumero) {
          // Si el pedido cargado es diferente al actual, redirigir
          // ⭐ Asegurar que la navegación se complete antes de continuar
          await router.push(`${pathBase}/${encodeURIComponent(numeroPedido)}`)
          // ⭐ Pequeño delay para asegurar que el componente detecte el cambio de ruta
          // Esto es necesario porque el watcher puede no ejecutarse inmediatamente
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
      // Solo si el error es de códigos no válidos en SAP
      const esErrorSap = errorInfo.title?.includes('SAP') || errorInfo.title?.includes('producto') || errorInfo.title?.includes('no encontrados')
      if (esErrorSap) {
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
   * ⭐ NUEVA FUNCIONALIDAD: Reintenta la carga del archivo con correcciones de códigos aplicadas
   */
  async function reintentarConCorrecciones(
    file: File,
    correcciones: Record<string, string>
  ): Promise<void> {
    if (!file) {
      throw new Error('Archivo no disponible para reintento')
    }
    
    if (!correcciones || Object.keys(correcciones).length === 0) {
      throw new Error('No se proporcionaron correcciones de códigos')
    }
    
    uploading.value = true
    resetProgress()
    uploadFase.value = 'upload'
    uploadMessage.value = 'Preparando archivo con correcciones...'
    
    try {
      // ⭐ Callback para actualizar el progreso
      const handleProgress = (progress: number, fase: 'upload' | 'processing') => {
        if (fase === 'upload') {
          uploadProgress.value = progress
          uploadFase.value = 'upload'
          updateUploadMessage('upload', progress)
          
          if (progress >= 70) {
            startProcessingProgressSimulation()
          }
        } else if (fase === 'processing') {
          stopProcessingProgressSimulation(true)
        }
      }
      
      // Llamar al servicio con correcciones
      const response: UploadPlantillaResponse = await mba3ConsultasService.uploadPlantillaConCorrecciones(
        file,
        correcciones,
        handleProgress
      )
      
      // Limpiar archivo original después del éxito
      archivoOriginal.value = null
      
      // Obtener numero_pedido de la respuesta
      let numeroPedido = response.numero_pedido
      
      // Si no viene en la respuesta, intentar obtenerlo del pedido cargado usando pedido_id
      if (!numeroPedido && response.pedido_id && options?.pedido?.value) {
        try {
          const pedidoCompleto = await mba3ConsultasService.getPedido(response.pedido_id, false)
          numeroPedido = pedidoCompleto.cabecera.numero_pedido || undefined
        } catch (e) {
          console.warn('No se pudo obtener el numero_pedido del pedido cargado:', e)
        }
      }
      
      // Mostrar mensaje de éxito
      const mensajeDetalle = `Correcciones aplicadas exitosamente.\n\nNúmero de pedido: ${numeroPedido || 'N/A'}\nArtículos: ${response.articulos_cargados}\nDistribuciones: ${response.distribuciones_cargadas}`
      
      if (response.status === 'success') {
        toast.success('Plantilla procesada con correcciones', mensajeDetalle)
      } else if (response.status === 'validation_error') {
        toast.warning('Plantilla procesada con advertencias', mensajeDetalle)
      }
      
      // Llamar callback de éxito si existe
      if (numeroPedido && options?.onUploadSuccess) {
        await options.onUploadSuccess(numeroPedido, response)
      }
      
      // Redirigir o recargar según corresponda
      if (numeroPedido) {
        const currentPedidoNumero = options?.pedido?.value?.cabecera.numero_pedido
        const pathBase = options?.redirectToCargarPlantilla ? '/mba3-consultas/cargar-plantilla' : '/mba3-consultas/pedidos'
        if (numeroPedido !== currentPedidoNumero) {
          // Si el pedido cargado es diferente al actual, redirigir
          // ⭐ Asegurar que la navegación se complete antes de continuar
          await router.push(`${pathBase}/${encodeURIComponent(numeroPedido)}`)
          // ⭐ Pequeño delay para asegurar que el componente detecte el cambio de ruta
          // Esto es necesario porque el watcher puede no ejecutarse inmediatamente
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
      
      // Si hay error en el reintento, procesar el error normalmente
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
      
      // Re-lanzar para que el componente pueda manejar el error
      throw e
    } finally {
      uploading.value = false
      // ⭐ Pequeño delay antes de resetear el progreso
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
