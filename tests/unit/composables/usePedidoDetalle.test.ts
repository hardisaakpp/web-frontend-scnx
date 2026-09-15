import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, computed, type Ref } from 'vue'
import { usePedidoDetalle } from '@/modules/mba3-consultas/composables/usePedidoDetalle'
import type { PedidoCompleto, ReporteDiferenciasResponse } from '@/modules/mba3-consultas/types'

// Mock del router
const mockPush = vi.fn()
vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => ({
      params: { id: 'P-12.48 - 12 - 2025' }
    }),
    useRouter: () => ({
      push: mockPush
    })
  }
})

// Mock del toast
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockToastInfo = vi.fn()
const mockToastWarning = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: mockToastInfo,
    warning: mockToastWarning
  })
}))

// Mock del servicio
const mockGetPedido = vi.fn()
const mockObtenerModificacionesColumnas = vi.fn()
const mockGetReporteDiferencias = vi.fn()
const mockCrearOrdenCompraDesdePedido = vi.fn()
vi.mock('@/modules/mba3-consultas/services/mba3ConsultasApi', () => ({
  mba3ConsultasService: {
    obtenerModificacionesColumnas: (...args: any[]) => mockObtenerModificacionesColumnas(...args),
    getReporteDiferencias: (...args: any[]) => mockGetReporteDiferencias(...args),
    crearOrdenCompraDesdePedido: (...args: any[]) => mockCrearOrdenCompraDesdePedido(...args)
  }
}))
vi.mock('@/modules/mba3-consultas/services/domains/pedidos', () => ({
  pedidosService: {
    getPedido: (...args: any[]) => mockGetPedido(...args)
  }
}))

// Mock del clipboard
const mockClipboardWriteText = vi.fn()
Object.assign(navigator, {
  clipboard: {
    writeText: mockClipboardWriteText
  }
})

// Mock del scrollIntoView y querySelector
const mockScrollIntoView = vi.fn()
const mockScrollTo = vi.fn()
const mockQuerySelector = vi.fn()
Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
  writable: true
})
Object.defineProperty(window, 'scrollTo', {
  value: mockScrollTo,
  writable: true
})

describe('usePedidoDetalle', () => {
  let mockPedido: Ref<PedidoCompleto | null>
  let mockNumeroPedido: Ref<string>
  let mockEsModoMabelTrading: Ref<boolean>
  let mockColumnasModificadas: Ref<Set<string>>
  let mockProductosRedistribucion: Ref<any[]>
  let mockReporteDiferencias: Ref<ReporteDiferenciasResponse | null>
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Crear refs para las opciones
    mockPedido = ref<PedidoCompleto | null>(null)
    mockNumeroPedido = ref('P-12.48 - 12 - 2025')
    mockEsModoMabelTrading = ref(false)
    mockColumnasModificadas = ref(new Set())
    mockProductosRedistribucion = ref([])
    mockReporteDiferencias = ref<ReporteDiferenciasResponse | null>(null)
    
    // Setup defaults para mocks
    mockGetPedido.mockResolvedValue({
      cabecera: {
        id_pedido: 1,
        numero_pedido: 'P-12.48 - 12 - 2025',
        estado: 'PENDIENTE'
      },
      detalle: []
    })
    mockObtenerModificacionesColumnas.mockResolvedValue({ modificaciones: [] })
    mockGetReporteDiferencias.mockResolvedValue(null)
  })
  
  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initial State', () => {
    it('should initialize with default state values', () => {
      const { loading, error, pedidoIdInput, showSearchHelp, copyFeedback, loadingReporte, generandoOC } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading,
        columnasModificadas: mockColumnasModificadas
      })
      
      expect(loading.value).toBe(false)
      expect(error.value).toBeFalsy()
      expect(pedidoIdInput.value).toBe('')
      expect(showSearchHelp.value).toBe(false)
      expect(copyFeedback.value).toBe(false)
      expect(loadingReporte.value).toBe(false)
      expect(generandoOC.value).toBe(false)
    })
  })

  describe('isValidPedido', () => {
    it('should validate correct pedido format (P-XX.XX - XX - XXXX)', () => {
      const { pedidoIdInput, isValidPedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      pedidoIdInput.value = 'P-12.48 - 12 - 2025'
      expect(isValidPedido.value).toBe(true)
    })
    
    it('should validate correct pedido format (P-XXXX - XX - XXXX)', () => {
      const { pedidoIdInput, isValidPedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      pedidoIdInput.value = 'P-1234 - 05 - 2024'
      expect(isValidPedido.value).toBe(true)
    })
    
    it('should accept format with special characters', () => {
      const { pedidoIdInput, isValidPedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      // El formato permite letras, números, puntos, guiones y espacios (min 5 chars)
      pedidoIdInput.value = 'INVALID-FORMAT'
      expect(isValidPedido.value).toBe(true) // Esto es válido por el regex permisivo
    })
    
    it('should return true for empty input (no muestra error hasta que escriba)', () => {
      const { pedidoIdInput, isValidPedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      pedidoIdInput.value = ''
      expect(isValidPedido.value).toBe(true) // Vacío es válido
    })
    
    it('should return false for too short input', () => {
      const { pedidoIdInput, isValidPedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      pedidoIdInput.value = 'P-1' // Menos de 5 caracteres
      expect(isValidPedido.value).toBe(false)
    })
  })

  describe('loadPedido', () => {
    it('should load pedido successfully', async () => {
      const mockPedidoData = {
        cabecera: {
          pedido_id: '1',
          numero_pedido: 'P-12.48 - 12 - 2025',
          estado: 'PENDIENTE'
        },
        detalle: [
          { id_detalle: 1, sku: 'SKU001', cantidad: 10 }
        ]
      }
      mockGetPedido.mockResolvedValue(mockPedidoData)
      mockObtenerModificacionesColumnas.mockResolvedValue({ modificaciones: [] })
      
      const { loadPedido, loading, error } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await loadPedido()
      
      expect(loading.value).toBe(false)
      expect(error.value).toBeFalsy()
      expect(mockPedido.value).toEqual(mockPedidoData)
      expect(mockGetPedido).toHaveBeenCalledWith('P-12.48 - 12 - 2025', true)
    })
    
    it('should handle pedido load error', async () => {
      const errorMessage = 'Error al cargar pedido'
      mockGetPedido.mockRejectedValue(new Error(errorMessage))
      
      const { loadPedido, loading, error } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await loadPedido()
      
      expect(loading.value).toBe(false)
      expect(error.value).toBe(errorMessage)
      expect(mockToastError).toHaveBeenCalledWith('Error', errorMessage)
    })
    
    it('should load modificaciones from backend when available', async () => {
      const mockModificaciones = {
        modificaciones: [
          { pedido_detalle_id: 1, columna_key: 'cantidad' },
          { pedido_detalle_id: 2, columna_key: 'precio' }
        ]
      }
      mockGetPedido.mockResolvedValue({
        cabecera: { id_pedido: 1, numero_pedido: 'P-12.48 - 12 - 2025', estado: 'PENDIENTE' },
        detalle: []
      })
      mockObtenerModificacionesColumnas.mockResolvedValue(mockModificaciones)
      
      const { loadPedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        columnasModificadas: mockColumnasModificadas,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await loadPedido()
      
      expect(mockObtenerModificacionesColumnas).toHaveBeenCalledWith('P-12.48 - 12 - 2025')
      expect(mockColumnasModificadas.value.size).toBe(2)
      expect(mockColumnasModificadas.value.has('1:cantidad')).toBe(true)
      expect(mockColumnasModificadas.value.has('2:precio')).toBe(true)
    })
    
    it('should use sessionStorage fallback when backend returns no modificaciones', async () => {
      const mockCargarDesdeStorage = vi.fn()
      mockGetPedido.mockResolvedValue({
        cabecera: { pedido_id: '1', numero_pedido: 'P-12.48 - 12 - 2025', estado: 'PENDIENTE' },
        detalle: []
      })
      mockObtenerModificacionesColumnas.mockResolvedValue({ modificaciones: [] })
      
      const { loadPedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        columnasModificadas: mockColumnasModificadas,
        cargarColumnasModificadasDesdeStorage: mockCargarDesdeStorage,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await loadPedido()
      
      expect(mockCargarDesdeStorage).toHaveBeenCalled()
    })
    
    it('should use sessionStorage fallback when backend returns 404', async () => {
      const mockCargarDesdeStorage = vi.fn()
      mockGetPedido.mockResolvedValue({
        cabecera: { pedido_id: '1', numero_pedido: 'P-12.48 - 12 - 2025', estado: 'PENDIENTE' },
        detalle: []
      })
      const error404 = new Error('404 - No existe')
      mockObtenerModificacionesColumnas.mockRejectedValue(error404)
      
      const { loadPedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        columnasModificadas: mockColumnasModificadas,
        cargarColumnasModificadasDesdeStorage: mockCargarDesdeStorage,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await loadPedido()
      
      expect(mockCargarDesdeStorage).toHaveBeenCalled()
    })
    
    it('should load reporte diferencias for APROBADA pedido', async () => {
      const mockReporte = { diferencias: [], totales: {} }
      mockGetPedido.mockResolvedValue({
        cabecera: { estado: 'PENDIENTE' },
        respuesta_proveedor: {
          cabecera: { estado: 'APROBADA' }
        }
      })
      mockObtenerModificacionesColumnas.mockResolvedValue({ modificaciones: [] })
      mockGetReporteDiferencias.mockResolvedValue(mockReporte)
      
      const { loadPedido, reporteDiferencias } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await loadPedido()
      
      expect(mockGetReporteDiferencias).toHaveBeenCalledWith('P-12.48 - 12 - 2025', 'json')
      expect(reporteDiferencias.value).toEqual(mockReporte)
    })
    
    it('should load reporte diferencias for CONFIRMADO_PROVEEDOR pedido', async () => {
      const mockReporte = { diferencias: [], totales: {} }
      mockGetPedido.mockResolvedValue({
        cabecera: { estado: 'CONFIRMADO_PROVEEDOR' },
        respuesta_proveedor: null
      })
      mockObtenerModificacionesColumnas.mockResolvedValue({ modificaciones: [] })
      mockGetReporteDiferencias.mockResolvedValue(mockReporte)
      
      const { loadPedido, reporteDiferencias } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await loadPedido()
      
      expect(mockGetReporteDiferencias).toHaveBeenCalledWith('P-12.48 - 12 - 2025', 'json')
      expect(reporteDiferencias.value).toEqual(mockReporte)
    })
    
    it('should initialize redistribucion productos when in modo mabel trading', async () => {
      const mockInicializarRedistribucion = vi.fn()
      const mockEsModoMabelTrading = computed(() => true)
      
      mockGetPedido.mockResolvedValue({
        cabecera: { estado: 'PENDIENTE' },
        respuesta_proveedor: {
          cabecera: { estado: 'APROBADA' }
        }
      })
      mockObtenerModificacionesColumnas.mockResolvedValue({ modificaciones: [] })
      mockGetReporteDiferencias.mockResolvedValue(null)
      
      const { loadPedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading,
        inicializarProductosRedistribucion: mockInicializarRedistribucion
      })
      
      await loadPedido()
      
      expect(mockInicializarRedistribucion).toHaveBeenCalled()
    })
  })

  describe('handleGenerarOCDesdePedido', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    
    afterEach(() => {
      vi.useRealTimers()
    })
    
    it('should generate OC successfully', async () => {
      mockPedido.value = {
        cabecera: { pedido_id: '1', numero_pedido: 'P-12.48 - 12 - 2025', estado: 'PENDIENTE' } as any,
        detalles: []
      }
      mockGetPedido.mockResolvedValue(mockPedido.value)
      mockObtenerModificacionesColumnas.mockResolvedValue({ modificaciones: [] })
      mockCrearOrdenCompraDesdePedido.mockResolvedValue({
        status: 'success',
        message: 'Orden de compra creada exitosamente'
      })
      
      const { handleGenerarOCDesdePedido, generandoOC } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      const promise = handleGenerarOCDesdePedido()
      
      expect(generandoOC.value).toBe(true)
      
      await promise
      
      expect(mockCrearOrdenCompraDesdePedido).toHaveBeenCalledWith('P-12.48 - 12 - 2025')
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Orden de compra generada',
        'Orden de compra creada exitosamente'
      )
      expect(generandoOC.value).toBe(false)
      
      // Verificar redirección después del delay
      vi.advanceTimersByTime(1500)
      expect(mockPush).toHaveBeenCalledWith('/mba3-consultas/proceso-completo?tab=procesar-oc')
    })
    
    it('should handle OC generation error', async () => {
      mockPedido.value = {
        cabecera: { pedido_id: '1', numero_pedido: 'P-12.48 - 12 - 2025', estado: 'PENDIENTE' } as any,
        detalles: []
      }
      mockCrearOrdenCompraDesdePedido.mockResolvedValue({
        status: 'error',
        message: 'No se pudo crear la orden'
      })
      
      const { handleGenerarOCDesdePedido, generandoOC } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await handleGenerarOCDesdePedido()
      
      expect(mockToastError).toHaveBeenCalledWith(
        'Error al generar orden',
        'No se pudo crear la orden'
      )
      expect(generandoOC.value).toBe(false)
      expect(mockPush).not.toHaveBeenCalled()
    })
    
    it('should handle OC generation exception', async () => {
      mockPedido.value = {
        cabecera: { pedido_id: '1', numero_pedido: 'P-12.48 - 12 - 2025', estado: 'PENDIENTE' } as any,
        detalles: []
      }
      const errorMessage = 'Network error'
      mockCrearOrdenCompraDesdePedido.mockRejectedValue(new Error(errorMessage))
      
      const { handleGenerarOCDesdePedido, generandoOC } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await handleGenerarOCDesdePedido()
      
      expect(mockToastError).toHaveBeenCalledWith('Error al generar orden', errorMessage)
      expect(generandoOC.value).toBe(false)
    })
    
    it('should not generate OC if pedido is null', async () => {
      mockPedido.value = null
      
      const { handleGenerarOCDesdePedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await handleGenerarOCDesdePedido()
      
      expect(mockCrearOrdenCompraDesdePedido).not.toHaveBeenCalled()
    })
  })

  describe('goToPedido', () => {
    it('should navigate to valid pedido', () => {
      const { pedidoIdInput, goToPedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      pedidoIdInput.value = 'P-12.48 - 12 - 2025'
      goToPedido()
      
      expect(mockPush).toHaveBeenCalledWith('/mba3-consultas/pedidos/P-12.48%20-%2012%20-%202025')
      expect(mockToastWarning).not.toHaveBeenCalled()
    })
    
    it('should show warning for empty input', () => {
      const { pedidoIdInput, goToPedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      pedidoIdInput.value = ''
      goToPedido()
      
      expect(mockToastWarning).toHaveBeenCalledWith('Campo vacío', 'Por favor ingresa un número de pedido')
      expect(mockPush).not.toHaveBeenCalled()
    })
    
    it('should show warning for invalid format', () => {
      const { pedidoIdInput, goToPedido } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      pedidoIdInput.value = 'XY' // Menos de 5 caracteres (inválido)
      goToPedido()
      
      expect(mockToastWarning).toHaveBeenCalledWith(
        'Formato inválido',
        'Usa el número de pedido tal como aparece en el Excel. Ejemplo: P-12.48 - 12 - 2025'
      )
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('copyToClipboard', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    
    afterEach(() => {
      vi.useRealTimers()
    })
    
    it('should copy text to clipboard successfully', async () => {
      mockClipboardWriteText.mockResolvedValue(undefined)
      
      const { copyToClipboard, copyFeedback } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await copyToClipboard('P-12.48 - 12 - 2025')
      
      expect(mockClipboardWriteText).toHaveBeenCalledWith('P-12.48 - 12 - 2025')
      expect(copyFeedback.value).toBe(true)
      
      vi.advanceTimersByTime(2000)
      expect(copyFeedback.value).toBe(false)
    })
    
    it('should handle clipboard error', async () => {
      mockClipboardWriteText.mockRejectedValue(new Error('Clipboard not available'))
      
      const { copyToClipboard } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await copyToClipboard('P-12.48 - 12 - 2025')
      
      expect(mockToastError).toHaveBeenCalledWith('Error', 'No se pudo copiar al portapapeles')
    })
  })

  describe('handleViewReporteDiferencias', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    
    afterEach(() => {
      vi.useRealTimers()
    })
    
    it('should scroll to reporte when already loaded', async () => {
      const mockElement = {
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        },
        getBoundingClientRect: () => ({ top: 500 })
      }
      mockQuerySelector.mockReturnValue(mockElement)
      Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true })
      
      const { handleViewReporteDiferencias, reporteDiferencias } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      reporteDiferencias.value = {
        pedido_id: '1',
        numero_pedido: 'P-12.48 - 12 - 2025',
        resumen: {
          total_productos: 0,
          total_solicitado: 0,
          total_confirmado: 0,
          total_diferencia: 0,
          porcentaje_confirmacion: 0
        },
        detalle: []
      }
      
      await handleViewReporteDiferencias()
      
      vi.advanceTimersByTime(100)
      
      expect(mockQuerySelector).toHaveBeenCalledWith('[data-reporte-diferencias]')
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 420, // 500 - 80 (header offset)
        behavior: 'smooth'
      })
      expect(mockElement.classList.add).toHaveBeenCalledWith('ring-2', 'ring-purple-500', 'ring-opacity-50')
      
      vi.advanceTimersByTime(2000)
      expect(mockElement.classList.remove).toHaveBeenCalledWith('ring-2', 'ring-purple-500', 'ring-opacity-50')
    })
    
    it('should show warning if reporte not available', async () => {
      mockGetReporteDiferencias.mockResolvedValue(null)
      
      const { handleViewReporteDiferencias, reporteDiferencias } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      reporteDiferencias.value = null
      
      await handleViewReporteDiferencias()
      
      expect(mockToastWarning).toHaveBeenCalledWith(
        'Reporte no disponible',
        'El reporte de diferencias aún no está disponible. Debe procesar la confirmación del proveedor primero.'
      )
    })
  })

  describe('handleExportReporteDiferencias', () => {
    it('should export reporte to Excel successfully', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      mockGetReporteDiferencias.mockResolvedValue(mockBlob)
      
      mockPedido.value = {
        cabecera: {
          pedido_id: '1',
          numero_pedido: 'P-12.48 - 12 - 2025',
          estado: 'PENDIENTE'
        } as any,
        detalles: []
      }
      
      // Mock DOM operations
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn()
      }
      const mockCreateElement = vi.fn(() => mockAnchor)
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()
      const mockCreateObjectURL = vi.fn(() => 'blob:test-url')
      const mockRevokeObjectURL = vi.fn()
      
      document.createElement = mockCreateElement as any
      document.body.appendChild = mockAppendChild as any
      document.body.removeChild = mockRemoveChild as any
      window.URL.createObjectURL = mockCreateObjectURL
      window.URL.revokeObjectURL = mockRevokeObjectURL
      
      const { handleExportReporteDiferencias } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await handleExportReporteDiferencias()
      
      expect(mockGetReporteDiferencias).toHaveBeenCalledWith('P-12.48 - 12 - 2025', 'excel')
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob)
      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url')
      expect(mockToastSuccess).toHaveBeenCalledWith('Reporte exportado', 'El reporte de diferencias se ha descargado correctamente')
    })
    
    it('should handle export error', async () => {
      mockPedido.value = {
        cabecera: {
          pedido_id: '1',
          numero_pedido: 'P-12.48 - 12 - 2025',
          estado: 'PENDIENTE'
        } as any,
        detalles: []
      }
      
      const errorMessage = 'Error al exportar'
      mockGetReporteDiferencias.mockRejectedValue(new Error(errorMessage))
      
      const { handleExportReporteDiferencias } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await handleExportReporteDiferencias()
      
      expect(mockToastError).toHaveBeenCalledWith('Error al exportar', errorMessage)
    })
    
    it('should not export if pedido is null', async () => {
      mockPedido.value = null
      
      const { handleExportReporteDiferencias } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      await handleExportReporteDiferencias()
      
      expect(mockGetReporteDiferencias).not.toHaveBeenCalled()
    })
  })

  describe('handleSearchBlur', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    
    afterEach(() => {
      vi.useRealTimers()
    })
    
    it('should hide search help after delay', () => {
      const { handleSearchBlur, showSearchHelp } = usePedidoDetalle({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })
      
      showSearchHelp.value = true
      handleSearchBlur()
      
      expect(showSearchHelp.value).toBe(true)
      
      vi.advanceTimersByTime(200)
      
      expect(showSearchHelp.value).toBe(false)
    })
  })
})
