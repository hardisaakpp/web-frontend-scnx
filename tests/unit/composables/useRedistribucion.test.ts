import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRedistribucion } from '@/modules/mba3-consultas/composables/useRedistribucion'
import type { PedidoCompleto, ReporteDiferenciasResponse } from '@/modules/mba3-consultas/types'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '@/modules/mba3-consultas/services/mba3ConsultasApi'

// Mocks
vi.mock('@/composables/useToast')
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as any,
    useRouter: vi.fn()
  }
})
vi.mock('@/modules/mba3-consultas/services/mba3ConsultasApi', () => ({
  mba3ConsultasService: {
    guardarBorradorRedistribucion: vi.fn(),
    confirmarRedistribucion: vi.fn()
  }
}))

describe('useRedistribucion', () => {
  let mockPedido: Ref<PedidoCompleto | null>
  let mockNumeroPedido: Ref<string>
  let mockEsModoMabelTrading: Ref<boolean>
  let mockReporteDiferencias: Ref<ReporteDiferenciasResponse | null>
  let mockToast: any
  let mockRouter: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock toast
    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }
    vi.mocked(useToast).mockReturnValue(mockToast)

    // Mock router
    mockRouter = {
      push: vi.fn()
    }
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)

    // Initialize refs
    mockPedido = ref(null)
    mockNumeroPedido = ref('P-12.48 - 01 - 2026')
    mockEsModoMabelTrading = ref(true)
    mockReporteDiferencias = ref(null)
  })

  describe('Initial State', () => {
    it('should initialize with empty redistribution products', () => {
      const { productosRedistribucion } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      expect(productosRedistribucion.value).toEqual([])
    })

    it('should initialize with empty expanded products set', () => {
      const { productosExpandidos } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      expect(productosExpandidos.value).toBeInstanceOf(Set)
      expect(productosExpandidos.value.size).toBe(0)
    })

    it('should initialize with false loading states', () => {
      const { guardandoRedistribucion, confirmandoRedistribucion } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      expect(guardandoRedistribucion.value).toBe(false)
      expect(confirmandoRedistribucion.value).toBe(false)
    })
  })

  describe('inicializarProductosRedistribucion', () => {
    it('should initialize products from respuesta_proveedor', () => {
      mockPedido.value = {
        cabecera: { pedido_id: '1', numero_pedido: 'P-12.48 - 01 - 2026' } as any,
        detalles: [
          {
            codigo_interno: 'PROD-001',
            tiendas: [
              { codigo: 'T01', nombre: 'Tienda 1', cantidad: 10 },
              { codigo: 'T02', nombre: 'Tienda 2', cantidad: 20 }
            ]
          } as any
        ],
        respuesta_proveedor: {
          detalles: [
            {
              codigo_producto: 'PROD-001',
              descripcion: 'Producto Test',
              cantidad_solicitada_total: 30,
              cantidad_confirmada_total: 30,
              costo_doc_sin_iva_ajustado: 100,
              pedido_detalle_id: 1
            }
          ]
        } as any
      }

      const { inicializarProductosRedistribucion, productosRedistribucion } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      inicializarProductosRedistribucion()

      expect(productosRedistribucion.value).toHaveLength(1)
      expect(productosRedistribucion.value[0]).toMatchObject({
        codigo_producto: 'PROD-001',
        descripcion: 'Producto Test',
        cantidad_solicitada: 30,
        cantidad_confirmada: 30,
        cantidad_distribuida: 30,
        diferencia: 0,
        costo_unitario: 100
      })
      expect(productosRedistribucion.value[0].distribucion_tiendas).toHaveLength(2)
    })

    it('should handle products without tiendas', () => {
      mockPedido.value = {
        cabecera: { pedido_id: '1', numero_pedido: 'P-12.48 - 01 - 2026' } as any,
        detalles: [],
        respuesta_proveedor: {
          detalles: [
            {
              codigo_producto: 'PROD-002',
              descripcion: 'Producto Sin Tiendas',
              cantidad_solicitada_total: 50,
              cantidad_confirmada_total: 50,
              costo_doc_sin_iva_ajustado: 200,
              pedido_detalle_id: 2
            }
          ]
        } as any
      }

      const { inicializarProductosRedistribucion, productosRedistribucion } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      inicializarProductosRedistribucion()

      expect(productosRedistribucion.value).toHaveLength(1)
      expect(productosRedistribucion.value[0].distribucion_tiendas).toHaveLength(0)
    })

    it('should clear products when no respuesta_proveedor', () => {
      mockPedido.value = {
        cabecera: { pedido_id: '1', numero_pedido: 'P-12.48 - 01 - 2026' } as any,
        detalles: []
      }

      const { inicializarProductosRedistribucion, productosRedistribucion } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      inicializarProductosRedistribucion()

      expect(productosRedistribucion.value).toEqual([])
    })
  })

  describe('validarProducto', () => {
    it('should return error when distributed exceeds confirmed', () => {
      mockPedido.value = {
        cabecera: { pedido_id: '1', numero_pedido: 'P-12.48 - 01 - 2026' } as any,
        detalles: [],
        respuesta_proveedor: {
          detalles: [
            {
              codigo_producto: 'PROD-001',
              descripcion: 'Producto Test',
              cantidad_solicitada_total: 30,
              cantidad_confirmada_total: 30,
              costo_doc_sin_iva_ajustado: 100,
              pedido_detalle_id: 1
            }
          ]
        } as any
      }

      const { inicializarProductosRedistribucion, productosRedistribucion, validarProducto } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      inicializarProductosRedistribucion()
      
      // Modificar para exceder
      const producto = productosRedistribucion.value[0]
      producto.cantidad_distribuida = 40

      const error = validarProducto(producto)
      expect(error).toContain('excede el total confirmado')
    })

    it('should return error for negative quantities', () => {
      const { validarProducto } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      const producto = {
        codigo_producto: 'PROD-001',
        descripcion: 'Test',
        cantidad_solicitada: 30,
        cantidad_confirmada: 30,
        cantidad_distribuida: 30,
        diferencia: 0,
        costo_unitario: 100,
        distribucion_tiendas: [
          {
            tienda_codigo: 'T01',
            tienda_nombre: 'Tienda 1',
            cantidad_original: 10,
            cantidad_asignada: -5,
            diferencia: -15,
            es_bodega: false
          }
        ]
      } as any

      const error = validarProducto(producto)
      expect(error).toContain('cantidades negativas')
    })

    it('should return error for decimal quantities', () => {
      const { validarProducto } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      const producto = {
        codigo_producto: 'PROD-001',
        descripcion: 'Test',
        cantidad_solicitada: 30,
        cantidad_confirmada: 30,
        cantidad_distribuida: 30,
        diferencia: 0,
        costo_unitario: 100,
        distribucion_tiendas: [
          {
            tienda_codigo: 'T01',
            tienda_nombre: 'Tienda 1',
            cantidad_original: 10,
            cantidad_asignada: 10.5,
            diferencia: 0.5,
            es_bodega: false
          }
        ]
      } as any

      const error = validarProducto(producto)
      expect(error).toContain('números enteros')
    })

    it('should return error for quantities exceeding maximum limit', () => {
      const { validarProducto } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      const producto = {
        codigo_producto: 'PROD-001',
        descripcion: 'Test',
        cantidad_solicitada: 1000001,
        cantidad_confirmada: 1000001,
        cantidad_distribuida: 1000001,
        diferencia: 0,
        costo_unitario: 100,
        distribucion_tiendas: [
          {
            tienda_codigo: 'T01',
            tienda_nombre: 'Tienda 1',
            cantidad_original: 1000001,
            cantidad_asignada: 1000001,
            diferencia: 0,
            es_bodega: false
          }
        ]
      } as any

      const error = validarProducto(producto)
      expect(error).toContain('límite máximo')
    })

    it('should return error when missing distributed quantity', () => {
      const { validarProducto } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      const producto = {
        codigo_producto: 'PROD-001',
        descripcion: 'Test',
        cantidad_solicitada: 30,
        cantidad_confirmada: 30,
        cantidad_distribuida: 20,
        diferencia: -10,
        costo_unitario: 100,
        distribucion_tiendas: []
      } as any

      const error = validarProducto(producto)
      expect(error).toContain('Faltan')
    })

    it('should return undefined for valid product', () => {
      const { validarProducto } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      const producto = {
        codigo_producto: 'PROD-001',
        descripcion: 'Test',
        cantidad_solicitada: 30,
        cantidad_confirmada: 30,
        cantidad_distribuida: 30,
        diferencia: 0,
        costo_unitario: 100,
        distribucion_tiendas: [
          {
            tienda_codigo: 'T01',
            tienda_nombre: 'Tienda 1',
            cantidad_original: 10,
            cantidad_asignada: 10,
            diferencia: 0,
            es_bodega: false
          },
          {
            tienda_codigo: 'T02',
            tienda_nombre: 'Tienda 2',
            cantidad_original: 20,
            cantidad_asignada: 20,
            diferencia: 0,
            es_bodega: false
          }
        ]
      } as any

      const error = validarProducto(producto)
      expect(error).toBeUndefined()
    })
  })

  describe('toggleExpandirProducto', () => {
    it('should toggle product expansion', () => {
      const { toggleExpandirProducto, productosExpandidos } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      const codigoProducto = 'PROD-001'

      expect(productosExpandidos.value.has(codigoProducto)).toBe(false)

      toggleExpandirProducto(codigoProducto)
      expect(productosExpandidos.value.has(codigoProducto)).toBe(true)

      toggleExpandirProducto(codigoProducto)
      expect(productosExpandidos.value.has(codigoProducto)).toBe(false)
    })
  })

  describe('guardarBorradorRedistribucion', () => {
    it('should have guardarBorradorRedistribucion function', () => {
      const { guardarBorradorRedistribucion } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      expect(guardarBorradorRedistribucion).toBeDefined()
      expect(typeof guardarBorradorRedistribucion).toBe('function')
    })
  })

  describe('confirmarRedistribucion', () => {
    it('should have confirmarRedistribucion function', () => {
      const { confirmarRedistribucion } = useRedistribucion({
        pedido: mockPedido,
        numeroPedido: mockNumeroPedido,
        esModoMabelTrading: mockEsModoMabelTrading
      })

      expect(confirmarRedistribucion).toBeDefined()
      expect(typeof confirmarRedistribucion).toBe('function')
    })
  })
})
