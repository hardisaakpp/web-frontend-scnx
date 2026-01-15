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
    let tiendasNoEncontradasSAP: string[] = []
    let bodegasNoEncontradasSAP: string[] = []

    const errorMessageStr = e.message || ''
    
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
        
        // Si viene como lista de códigos (nuevo formato)
        if (Array.isArray(sap.no_encontrados)) {
          sap.no_encontrados.forEach((codigo: string) => {
            if (!productosNoEncontradosSAP.includes(codigo)) {
              productosNoEncontradosSAP.push(codigo)
            }
          })
        } else if (sap.no_encontrados > 0 || sap.errores > 0) {
          // Formato antiguo (solo conteos)
          errorErrors.push({
            tipo: 'ERROR',
            campo: 'ValidacionSAP',
            mensaje: `${sap.no_encontrados || 0} código(s) no encontrado(s) en SAP, ${sap.errores || 0} error(es)`,
            producto: undefined
          })
        }
      }
      
      // ✅ Extraer códigos desde data estructurado (BusinessException)
      if (errorData.data?.validacion) {
        const validacion = errorData.data.validacion
        
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

    // Ajustar título y mensaje según tipo de error
    if (isSAPError) {
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
      if (totalErrores > 0) {
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
      } else {
        // Si no se pudieron extraer códigos, usar el mensaje del backend directamente
        errorMessage = errorMessageStr || `Uno o más códigos del archivo no fueron encontrados en SAP.\n\nVerifica que todos los códigos estén correctamente registrados en SAP.`
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
