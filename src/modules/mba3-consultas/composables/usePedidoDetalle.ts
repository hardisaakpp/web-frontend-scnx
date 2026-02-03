/**
 * Composable para manejar la carga y gestión del pedido
 */
import { ref, Ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { PedidoCompleto, ReporteDiferenciasResponse } from '../types'

const SCROLL_DELAY_MS = 100
const ROUTE_REDIRECT_DELAY_MS = 1500
const SEARCH_HELP_BLUR_DELAY_MS = 200

export function usePedidoDetalle(options: {
  pedido: Ref<PedidoCompleto | null>
  numeroPedido: Ref<string>
  /** Obsoleto en vista detalle de pedido. Si no se pasa, se usa false. */
  esModoMabelTrading?: Ref<boolean>
  columnasModificadas?: Ref<Set<string>>
  limpiarColumnasModificadasEnStorage?: () => void
  cargarColumnasModificadasDesdeStorage?: () => void
  /** Sincrono o async; si es async se espera antes de continuar (p. ej. cargarYInicializarRedistribucion). */
  inicializarProductosRedistribucion?: () => void | Promise<void>
  productosRedistribucion?: Ref<any[]>
  reporteDiferencias?: Ref<ReporteDiferenciasResponse | null>
  actualizarTiendasDesdeReporte?: () => void
}) {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const esModoMabelTrading = options.esModoMabelTrading ?? ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pedidoIdInput = ref('')
  const pedidoInputRef = ref<HTMLInputElement | null>(null)
  const showSearchHelp = ref(false)
  const copyFeedback = ref(false)

  const reporteDiferencias = ref<ReporteDiferenciasResponse | null>(null)
  const loadingReporte = ref(false)
  const generandoOC = ref(false)

  // Validación de número de pedido en tiempo real
  const isValidPedido = computed(() => {
    const trimmed = pedidoIdInput.value.trim()
    if (!trimmed) return true // Vacio es válido (no muestra error hasta que escriba)
    
    // Permitir letras, números, guiones, puntos, espacios
    // Longitud mínima: 5 caracteres
    // Formato flexible: P-12.48 - 12 - 2025, ODC-12345, etc.
    return /^[A-Za-z0-9.\-\s]{5,}$/.test(trimmed)
  })

  /**
   * Carga el pedido desde el backend
   */
  async function loadPedido() {
    loading.value = true
    error.value = null
    
    // Guardar el número de pedido anterior para comparar
    const pedidoAnterior = options.numeroPedido.value
    
    try {
      // Cargar pedido usando numero_pedido del parámetro de ruta
      if (!options.numeroPedido.value) {
        error.value = 'Número de pedido no válido'
        return
      }
      
      // Si se carga un pedido diferente, limpiar las columnas modificadas del pedido anterior
      if (pedidoAnterior && pedidoAnterior !== options.numeroPedido.value) {
        if (import.meta.env.DEV) console.log(`🔄 [usePedidoDetalle] Cambiando de pedido: ${pedidoAnterior} → ${options.numeroPedido.value}`)
        if (options.limpiarColumnasModificadasEnStorage) {
          options.limpiarColumnasModificadasEnStorage()
        }
        // También limpiar el Set directamente
        if (options.columnasModificadas) {
          options.columnasModificadas.value.clear()
        }
      }
      
      options.pedido.value = await mba3ConsultasService.getPedido(options.numeroPedido.value, true)
      
      // ⭐ FASE 3: Cargar columnas modificadas desde el backend (backend espera numero_pedido, no UUID)
      const numeroParaModificaciones = options.pedido.value?.cabecera?.numero_pedido ?? options.numeroPedido.value
      if (import.meta.env.DEV) console.log(`📥 [usePedidoDetalle] Cargando modificaciones para pedido: ${numeroParaModificaciones}`)
      const modificacionesCargadas = await cargarModificacionesDesdeBackend(numeroParaModificaciones)
      
      // Fallback: Cargar desde sessionStorage SOLO si el backend no tiene datos (migración)
      if (!modificacionesCargadas && options.cargarColumnasModificadasDesdeStorage) {
        if (import.meta.env.DEV) console.log('📦 [usePedidoDetalle] Usando fallback: sessionStorage')
        options.cargarColumnasModificadasDesdeStorage()
      }
      
      // Log final del estado de modificaciones
      if (options.columnasModificadas) {
        if (import.meta.env.DEV) console.log(`✅ [usePedidoDetalle] Estado final: ${options.columnasModificadas.value.size} modificaciones cargadas`)
      }
      
      // Inicializar productos para redistribución si hay respuesta del proveedor (o distribución guardada)
      if (options.pedido.value?.respuesta_proveedor && esModoMabelTrading.value && options.inicializarProductosRedistribucion) {
        await Promise.resolve(options.inicializarProductosRedistribucion())
      }
      
      // Si hay respuesta aprobada, cargar el reporte de diferencias
      if (options.pedido.value?.respuesta_proveedor?.cabecera.estado === 'APROBADA' ||
          options.pedido.value?.cabecera.estado === 'CONFIRMADO_PROVEEDOR' ||
          options.pedido.value?.cabecera.estado === 'CONFIRMADO_ENVIADO') {
        await loadReporteDiferencias()
      }
    } catch (e: any) {
      const errorMessage = e.message || 'Error al cargar el pedido'
      error.value = errorMessage
      toast.error('Error', errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Carga las modificaciones de columnas desde el backend.
   * Usar numero_pedido (ej. cabecera.numero_pedido) en la URL; el backend no acepta pedido_id (UUID).
   * @param numeroPedidoParaApi Número de pedido para la API (si no se pasa, se usa options.numeroPedido, que puede ser UUID)
   * @returns true si se cargaron modificaciones desde el backend, false en caso contrario
   */
  async function cargarModificacionesDesdeBackend(numeroPedidoParaApi?: string): Promise<boolean> {
    const numero = numeroPedidoParaApi ?? options.numeroPedido.value
    if (!numero || !options.columnasModificadas) return false
    
    try {
      const response = await mba3ConsultasService.obtenerModificacionesColumnas(numero)
      
      if (response.modificaciones && response.modificaciones.length > 0) {
        // Limpiar modificaciones actuales antes de cargar desde backend
        options.columnasModificadas.value.clear()
        
        // Cargar modificaciones desde el backend
        response.modificaciones.forEach(mod => {
          const key = `${mod.pedido_detalle_id}:${mod.columna_key}`
          options.columnasModificadas!.value.add(key)
          if (import.meta.env.DEV) console.log(`  ✓ Agregada modificación: ${key}`)
        })
        
        if (import.meta.env.DEV) console.log(`✅ [usePedidoDetalle] Cargadas ${response.modificaciones.length} modificaciones desde backend`)
        return true // Se cargaron modificaciones desde el backend
      }
      
      // Si el array está vacío, no hay modificaciones
      if (import.meta.env.DEV) console.log('ℹ️ [usePedidoDetalle] No hay modificaciones guardadas en backend para este pedido')
      return false
    } catch (error: any) {
      // Si es 404, simplemente no hay modificaciones guardadas (normal)
      if (error.response?.status === 404 || error.message?.includes('404') || error.message?.includes('No existe')) {
        if (import.meta.env.DEV) console.log('ℹ️ [usePedidoDetalle] No hay modificaciones guardadas en backend para este pedido (404)')
        return false
      } else {
        console.warn('⚠️ [usePedidoDetalle] Error al cargar modificaciones desde backend:', error.message)
        // Si hay un error diferente a 404, retornar false para usar fallback
        return false
      }
    }
  }

  /**
   * Carga el reporte de diferencias
   */
  async function loadReporteDiferencias() {
    // Usar numero_pedido para obtener el reporte
    if (!options.numeroPedido.value) return
    
    loadingReporte.value = true
    try {
      reporteDiferencias.value = await mba3ConsultasService.getReporteDiferencias(options.numeroPedido.value, 'json') as ReporteDiferenciasResponse
      
      // Actualizar tiendas desde reporte si estamos en modo redistribución
      if (esModoMabelTrading.value && options.productosRedistribucion && options.productosRedistribucion.value.length > 0 && options.actualizarTiendasDesdeReporte) {
        options.actualizarTiendasDesdeReporte()
      }
    } catch (e: any) {
      // Si es 404, simplemente no mostrar el reporte (aún no procesado)
      if (e.message?.includes('404') || e.message?.includes('No existe reporte')) {
        reporteDiferencias.value = null
      } else {
        console.error('Error al cargar reporte de diferencias:', e)
        // No mostrar error al usuario si no existe aún
      }
    } finally {
      loadingReporte.value = false
    }
  }

  /**
   * Genera una orden de compra desde el pedido
   */
  async function handleGenerarOCDesdePedido() {
    if (!options.pedido.value || !options.numeroPedido.value) return
    
    generandoOC.value = true
    
    try {
      toast.info('Generando orden de compra...', 'Creando orden de compra desde el pedido confirmado')
      
      const result = await mba3ConsultasService.crearOrdenCompraDesdePedido(options.numeroPedido.value)
      
      if (result.status === 'success') {
        toast.success(
          'Orden de compra generada',
          result.message || 'La orden de compra se ha generado exitosamente'
        )
        
        // Recargar el pedido para actualizar estados
        await loadPedido()
        
        // Redirigir a la vista de órdenes de compra después de un breve delay
        setTimeout(() => {
          router.push('/mba3-consultas/proceso-completo?tab=procesar-oc')
        }, ROUTE_REDIRECT_DELAY_MS)
      } else {
        toast.error('Error al generar orden', result.message || 'No se pudo generar la orden de compra')
      }
    } catch (e: any) {
      console.error('Error al generar orden de compra:', e)
      toast.error('Error al generar orden', e.message || 'No se pudo generar la orden de compra')
    } finally {
      generandoOC.value = false
    }
  }

  /**
   * Navega a la vista de reporte de diferencias
   */
  async function handleViewReporteDiferencias() {
    // Si no hay reporte cargado, intentar cargarlo
    if (!reporteDiferencias.value) {
      toast.info('Cargando reporte...', 'Obteniendo reporte de diferencias del servidor')
      await loadReporteDiferencias()
    }
    
    // Si después de cargar aún no hay reporte, mostrar mensaje
    if (!reporteDiferencias.value) {
      toast.warning(
        'Reporte no disponible',
        'El reporte de diferencias aún no está disponible. Debe procesar la confirmación del proveedor primero.'
      )
      return
    }
    
    // Scroll al reporte con un pequeño delay para asegurar que el DOM esté actualizado
    setTimeout(() => {
      const reporteElement = document.querySelector('[data-reporte-diferencias]')
      if (reporteElement) {
        // Calcular offset para el header sticky si existe
        const headerOffset = 80 // Altura aproximada del header sticky
        const elementPosition = reporteElement.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
        
        // Feedback visual: resaltar brevemente el reporte
        reporteElement.classList.add('ring-2', 'ring-purple-500', 'ring-opacity-50')
        setTimeout(() => {
          reporteElement.classList.remove('ring-2', 'ring-purple-500', 'ring-opacity-50')
        }, 2000)
      } else {
        // Si no se encuentra el elemento, intentar de nuevo después de un delay más largo
        setTimeout(() => {
          const retryElement = document.querySelector('[data-reporte-diferencias]')
          if (retryElement) {
            retryElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 500)
      }
    }, SCROLL_DELAY_MS)
  }

  /**
   * Exporta el reporte de diferencias a Excel
   */
  async function handleExportReporteDiferencias() {
    if (!options.pedido.value || !options.numeroPedido.value) return
    
    try {
      const blob = await mba3ConsultasService.getReporteDiferencias(options.numeroPedido.value, 'excel') as Blob
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const numeroPedidoParaDescarga = options.pedido.value.cabecera.numero_pedido || options.numeroPedido.value
      a.download = `Reporte_Diferencias_${numeroPedidoParaDescarga}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Reporte exportado', 'El reporte de diferencias se ha descargado correctamente')
    } catch (e: any) {
      toast.error('Error al exportar', e.message || 'No se pudo exportar el reporte')
    }
  }

  /**
   * Navega a un pedido específico
   */
  function goToPedido() {
    const numeroPedido = pedidoIdInput.value.trim()
    
    // Validar que no esté vacío
    if (!numeroPedido) {
      toast.warning('Campo vacío', 'Por favor ingresa un número de pedido')
      pedidoInputRef.value?.focus()
      return
    }
    
    // Validar formato antes de navegar
    if (!isValidPedido.value) {
      toast.warning(
        'Formato inválido',
        'Usa el número de pedido tal como aparece en el Excel. Ejemplo: P-12.48 - 12 - 2025'
      )
      pedidoInputRef.value?.focus()
      return
    }
    
    // Navegar al pedido
    router.push(`/mba3-consultas/pedidos/${encodeURIComponent(numeroPedido)}`)
    // No limpiar el input - el usuario puede querer buscar otro después
  }

  /**
   * Maneja el blur del input de búsqueda
   */
  function handleSearchBlur() {
    // Delay para permitir que el click en el texto de ayuda funcione
    setTimeout(() => {
      showSearchHelp.value = false
    }, SEARCH_HELP_BLUR_DELAY_MS)
  }

  /**
   * Copia texto al portapapeles
   */
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      copyFeedback.value = true
      setTimeout(() => {
        copyFeedback.value = false
      }, 2000)
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err)
      toast.error('Error', 'No se pudo copiar al portapapeles')
    }
  }

  return {
    // Estado
    loading,
    error,
    pedidoIdInput,
    pedidoInputRef,
    showSearchHelp,
    copyFeedback,
    reporteDiferencias,
    loadingReporte,
    generandoOC,
    
    // Computed
    isValidPedido,
    
    // Funciones
    loadPedido,
    loadReporteDiferencias,
    handleGenerarOCDesdePedido,
    handleViewReporteDiferencias,
    handleExportReporteDiferencias,
    goToPedido,
    handleSearchBlur,
    copyToClipboard,
    cargarColumnasModificadasDesdeStorage: options.cargarColumnasModificadasDesdeStorage
  }
}
