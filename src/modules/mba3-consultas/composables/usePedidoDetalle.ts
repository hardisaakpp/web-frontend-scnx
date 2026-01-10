/**
 * Composable para manejar la carga y gestión del pedido
 */
import { ref, Ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { PedidoCompleto, ProcesarConfirmacionResponse, ReporteDiferenciasResponse } from '../types'

const SCROLL_DELAY_MS = 100
const ROUTE_REDIRECT_DELAY_MS = 1500
const SEARCH_HELP_BLUR_DELAY_MS = 200

export function usePedidoDetalle(options: {
  pedido: Ref<PedidoCompleto | null>
  numeroPedido: Ref<string>
  esModoMabelTrading: Ref<boolean>
  columnasModificadas?: Ref<Set<string>>
  limpiarColumnasModificadasEnStorage?: () => void
  cargarColumnasModificadasDesdeStorage?: () => void
  inicializarProductosRedistribucion?: () => void
  productosRedistribucion?: Ref<any[]>
  reporteDiferencias?: Ref<ReporteDiferenciasResponse | null>
  actualizarTiendasDesdeReporte?: () => void
}) {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const pedidoIdInput = ref('')
  const pedidoInputRef = ref<HTMLInputElement | null>(null)
  const showSearchHelp = ref(false)
  const copyFeedback = ref(false)

  // Fase 4: Procesar confirmación
  const showProcesarModal = ref(false)
  const procesandoConfirmacion = ref(false)
  const forzarRedistribucion = ref(false)
  const procesarConfirmacionResult = ref<ProcesarConfirmacionResponse | null>(null)
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
      if (pedidoAnterior && pedidoAnterior !== options.numeroPedido.value && options.limpiarColumnasModificadasEnStorage) {
        options.limpiarColumnasModificadasEnStorage()
      }
      
      options.pedido.value = await mba3ConsultasService.getPedido(options.numeroPedido.value, true)
      
      // Cargar columnas modificadas desde sessionStorage después de cargar el pedido
      if (options.cargarColumnasModificadasDesdeStorage) {
        options.cargarColumnasModificadasDesdeStorage()
      }
      
      // Inicializar productos para redistribución si hay respuesta del proveedor
      if (options.pedido.value?.respuesta_proveedor && options.esModoMabelTrading.value && options.inicializarProductosRedistribucion) {
        options.inicializarProductosRedistribucion()
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
   * Carga el reporte de diferencias
   */
  async function loadReporteDiferencias() {
    // Usar numero_pedido para obtener el reporte
    if (!options.numeroPedido.value) return
    
    loadingReporte.value = true
    try {
      reporteDiferencias.value = await mba3ConsultasService.getReporteDiferencias(options.numeroPedido.value, 'json') as ReporteDiferenciasResponse
      
      // Actualizar tiendas desde reporte si estamos en modo redistribución
      if (options.esModoMabelTrading.value && options.productosRedistribucion && options.productosRedistribucion.value.length > 0 && options.actualizarTiendasDesdeReporte) {
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
   * Procesa la confirmación del proveedor
   */
  async function handleProcesarConfirmacion() {
    if (!options.pedido.value || !options.numeroPedido.value) return
    
    procesandoConfirmacion.value = true
    
    try {
      const result = await mba3ConsultasService.procesarConfirmacionProveedor(
        options.numeroPedido.value,
        forzarRedistribucion.value
      )
      
      procesarConfirmacionResult.value = result
      reporteDiferencias.value = {
        pedido_id: result.pedido_id,
        numero_pedido: options.pedido.value.cabecera.numero_pedido,
        resumen: result.resumen,
        detalle: result.reporte_diferencias
      }
      
      toast.success('Confirmación procesada', result.message)
      showProcesarModal.value = false
      
      // Recargar el pedido para actualizar estados
      await loadPedido()
    } catch (e: any) {
      // Manejar error 409 (ya procesado)
      if ((e as any).isConflict || (e as any).statusCode === 409) {
        toast.info('Ya procesado', e.message || 'Esta respuesta ya fue procesada anteriormente')
        showProcesarModal.value = false
        // Cargar el reporte existente
        await loadReporteDiferencias()
      } else {
        toast.error('Error al procesar', e.message || 'No se pudo procesar la confirmación')
      }
    } finally {
      procesandoConfirmacion.value = false
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
    if (!reporteDiferencias.value) {
      await loadReporteDiferencias()
    }
    
    // Scroll al reporte
    if (reporteDiferencias.value) {
      setTimeout(() => {
        const reporteElement = document.querySelector('[data-reporte-diferencias]')
        if (reporteElement) {
          reporteElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, SCROLL_DELAY_MS)
    }
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
    showProcesarModal,
    procesandoConfirmacion,
    forzarRedistribucion,
    procesarConfirmacionResult,
    reporteDiferencias,
    loadingReporte,
    generandoOC,
    
    // Computed
    isValidPedido,
    
    // Funciones
    loadPedido,
    loadReporteDiferencias,
    handleProcesarConfirmacion,
    handleGenerarOCDesdePedido,
    handleViewReporteDiferencias,
    handleExportReporteDiferencias,
    goToPedido,
    handleSearchBlur,
    copyToClipboard
  }
}
