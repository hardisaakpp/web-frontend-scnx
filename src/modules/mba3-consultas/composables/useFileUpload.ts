/**
 * Composable para manejar la carga de archivos Excel (plantillas)
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

export interface UploadErrorInfo {
  title?: string
  message: string
  fileName?: string
  errors?: Array<string | { tipo?: string; campo?: string; mensaje: string; producto?: string }>
}

export function useFileUpload(options: {
  onUploadSuccess?: (numeroPedido: string) => void | Promise<void>
  onUploadError?: (error: UploadErrorInfo) => void
  loadPedido?: () => Promise<void>
  pedido?: Ref<PedidoCompleto | null>
} = {}) {
  const router = useRouter()
  const toast = useToast()

  const uploading = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)
  const showErrorModal = ref(false)
  const uploadErrorInfo = ref<UploadErrorInfo | null>(null)

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
    let errorMessage = e.message || 'Error desconocido al subir plantilla'
    const errorErrors: Array<string | { tipo?: string; campo?: string; mensaje: string; producto?: string }> = []
    let productosNoEncontradosSAP: string[] = []

    const errorMessageStr = e.message || ''
    
    // Detectar errores de validación SAP del mensaje
    const sapErrorPatterns = [
      /Productos no encontrados en SAP:\s*([A-Za-z0-9,.\s-]+)/i,
      /no válidos en SAP[^:]*:\s*([A-Za-z0-9,.\s-]+)/i,
      /No se encontró información en SAP para SKU:\s*([A-Za-z0-9,.\s-]+)/i
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
        
        if (validacion.productos?.no_encontrados?.length > 0) {
          validacion.productos.no_encontrados.forEach((codigo: string) => {
            errorErrors.push({
              tipo: 'ERROR',
              campo: 'Producto SAP',
              mensaje: `No existe en SAP`,
              producto: codigo
            })
            if (!productosNoEncontradosSAP.includes(codigo)) {
              productosNoEncontradosSAP.push(codigo)
            }
          })
        }
        
        if (validacion.tiendas?.no_encontradas?.length > 0) {
          validacion.tiendas.no_encontradas.forEach(() => {
            errorErrors.push({
              tipo: 'ERROR',
              campo: 'CodigoTienda',
              mensaje: `Tienda no encontrada en el sistema`,
              producto: undefined
            })
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
      
      if (errorData.validacion_sap) {
        const sap = errorData.validacion_sap
        if (sap.no_encontrados > 0 || sap.errores > 0) {
          errorErrors.push({
            tipo: 'ERROR',
            campo: 'ValidacionSAP',
            mensaje: `${sap.no_encontrados} código(s) no encontrado(s) en SAP, ${sap.errores} error(es)`,
            producto: undefined
          })
        }
      }
    }

    if ((e as any).errors && Array.isArray((e as any).errors)) {
      errorErrors.push(...(e as any).errors)
    }

    // Identificar el tipo de error
    const isSAPError = productosNoEncontradosSAP.length > 0 || 
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

    // Ajustar título según tipo de error
    if (isSAPError) {
      errorTitle = 'Productos no encontrados en SAP'
      if (productosNoEncontradosSAP.length > 0) {
        productosNoEncontradosSAP.forEach(codigo => {
          const exists = errorErrors.some(err => 
            (typeof err !== 'string') && err.producto === codigo
          )
          if (!exists) {
            errorErrors.push({
              tipo: 'ERROR',
              campo: 'Producto SAP',
              mensaje: `El código no existe en la base de datos SAP`,
              producto: codigo
            })
          }
        })
        errorMessage = `El archivo contiene ${productosNoEncontradosSAP.length} producto(s) que no existen en SAP.\n\nVerifica que los códigos sean correctos y estén registrados en el sistema SAP antes de cargar el archivo.`
      } else {
        errorMessage = `Uno o más productos del archivo no fueron encontrados en SAP.\n\nVerifica que todos los códigos de producto estén correctamente registrados en SAP.`
      }
    } else if (isDuplicateError) {
      errorTitle = 'Número de pedido duplicado'
      // Extraer el número de pedido del mensaje si está disponible
      const numeroPedidoMatch = errorMessageStr.match(/['"]([^'"]+)['"]/)?.[1] || 
                                errorMessageStr.match(/número de pedido ['"]([^'"]+)['"]/i)?.[1] ||
                                errorMessageStr.match(/numero de pedido ['"]([^'"]+)['"]/i)?.[1]
      
      if (numeroPedidoMatch) {
        errorMessage = `El número de pedido "${numeroPedidoMatch}" ya existe en el sistema.\n\nNo es posible cargar un pedido con un número de pedido duplicado. Por favor, verifica el número de pedido e intenta con un número diferente.`
      } else {
        errorMessage = `El número de pedido que intentaste utilizar ya existe en el sistema.\n\nNo es posible cargar un pedido con un número de pedido duplicado. Por favor, verifica el número de pedido e intenta con un número diferente.`
      }
    } else if (isFormatError) {
      errorTitle = 'Error de formato'
      errorMessage = `El archivo Excel no tiene el formato correcto o está incompleto.\n\nAsegúrate de usar la plantilla oficial y completar todos los campos requeridos.`
    } else if ((e as any).isBusinessException) {
      errorTitle = 'No se puede procesar el archivo'
      errorMessage = errorMessageStr || 'Ocurrió un error de validación de negocio que impide procesar el archivo.'
    }
    
    return {
      title: errorTitle,
      message: errorMessage,
      fileName,
      errors: errorErrors.length > 0 ? errorErrors : undefined
    }
  }

  /**
   * Sube un archivo al servidor
   */
  async function uploadFile(file: File) {
    uploading.value = true
    
    try {
      const response: UploadPlantillaResponse = await mba3ConsultasService.uploadPlantilla(file)
      
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
        if (sap.no_encontrados > 0) {
          mensajeDetalle += `\n  • No encontrados en SAP: ${sap.no_encontrados}`
        }
        if (sap.errores > 0) {
          mensajeDetalle += `\n  • Errores: ${sap.errores}`
        }
        if (sap.warnings > 0) {
          mensajeDetalle += `\n  • Advertencias: ${sap.warnings}`
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
        await options.onUploadSuccess(numeroPedido)
      }
      
      // Redirigir o recargar según corresponda
      if (numeroPedido) {
        const currentPedidoNumero = options?.pedido?.value?.cabecera.numero_pedido
        if (numeroPedido !== currentPedidoNumero) {
          // Si el pedido cargado es diferente al actual, redirigir
          router.push(`/mba3-consultas/pedidos/${encodeURIComponent(numeroPedido)}`)
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
      const errorInfo = processUploadError(e, file.name)
      uploadErrorInfo.value = errorInfo
      showErrorModal.value = true
      
      const productosNoEncontradosSAP = errorInfo.errors?.filter(err => 
        typeof err !== 'string' && err.campo === 'Producto SAP'
      ).map(err => typeof err !== 'string' ? err.producto : '').filter(Boolean) as string[] || []
      
      toast.error(
        errorInfo.title || 'Error',
        productosNoEncontradosSAP.length > 0 
          ? `Productos no encontrados: ${productosNoEncontradosSAP.join(', ')}`
          : errorInfo.message.split('\n')[0]
      )
      
      if (options?.onUploadError) {
        options.onUploadError(errorInfo)
      }
    } finally {
      uploading.value = false
    }
  }

  // Cleanup al desmontar
  onUnmounted(() => {
    if (fileInput.value) {
      fileInput.value.remove()
      fileInput.value = null
    }
  })

  return {
    uploading,
    showErrorModal,
    uploadErrorInfo,
    openFileSelector,
    uploadFile,
    validateFile
  }
}
