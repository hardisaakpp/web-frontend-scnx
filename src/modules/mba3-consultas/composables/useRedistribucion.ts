/**
 * Composable para manejar la redistribución de productos a tiendas
 */
import { ref, Ref, type ComputedRef } from 'vue'
import { useToast } from '@/composables/useToast'
import { formatNumber } from '../utils/formatters'
import type { ProductoRedistribucion, DistribucionTiendaEditada } from '../utils/redistribucionHelpers'
import type { PedidoCompleto, ReporteDiferenciasResponse } from '../types'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'

export function useRedistribucion(options: {
  pedido: Ref<PedidoCompleto | null>
  numeroPedido: Ref<string>
  esModoMabelTrading: Ref<boolean>
  reporteDiferencias?: Ref<ReporteDiferenciasResponse | null>
  getReporteDiferencias?: () => Ref<ReporteDiferenciasResponse | null>
  loadPedido?: () => Promise<void>
  loadReporteDiferencias?: () => Promise<void>
}) {
  const toast = useToast()

  const productosRedistribucion = ref<ProductoRedistribucion[]>([])
  const productosExpandidos = ref<Set<string>>(new Set())
  const guardandoRedistribucion = ref(false)
  const confirmandoRedistribucion = ref(false)

  /**
   * Inicializa productos para redistribución desde respuesta_proveedor
   */
  function inicializarProductosRedistribucion() {
    if (!options.pedido.value?.respuesta_proveedor) {
      productosRedistribucion.value = []
      return
    }
    
    productosRedistribucion.value = options.pedido.value.respuesta_proveedor.detalles.map(detalle => {
      // Obtener distribución original desde pedido.detalles si existe
      const detallePedido = options.pedido.value?.detalles.find(
        d => d.codigo_interno === detalle.codigo_producto
      )
      
      // Obtener tiendas desde el detalle del pedido
      const tiendasOriginales = detallePedido?.tiendas || []
      
      // Crear distribución de tiendas
      const distribucion_tiendas: DistribucionTiendaEditada[] = tiendasOriginales.map(tienda => ({
        tienda_codigo: tienda.codigo,
        tienda_nombre: tienda.nombre || tienda.codigo,
        cantidad_original: tienda.cantidad,
        cantidad_asignada: tienda.cantidad, // Inicialmente igual a la original
        diferencia: 0
      }))
      
      // Si no hay tiendas, crear una distribución vacía (se puede agregar después)
      if (distribucion_tiendas.length === 0) {
      // Intentar obtener tiendas desde reporte de diferencias si existe
      const reporteDiferencias = options.getReporteDiferencias?.() || options.reporteDiferencias
      const reporteItem = reporteDiferencias?.value?.detalle.find(
        r => r.codigo_producto === detalle.codigo_producto
      )
        if (reporteItem?.distribucion_tiendas) {
          reporteItem.distribucion_tiendas.forEach(t => {
            distribucion_tiendas.push({
              tienda_codigo: t.tienda_codigo,
              tienda_nombre: t.tienda_nombre,
              cantidad_original: t.cantidad,
              cantidad_asignada: t.cantidad,
              diferencia: 0
            })
          })
        }
      }
      
      const cantidad_distribuida = distribucion_tiendas.reduce((sum, t) => sum + t.cantidad_asignada, 0)
      const diferencia = cantidad_distribuida - detalle.cantidad_confirmada_total
      
      return {
        codigo_producto: detalle.codigo_producto,
        descripcion: detalle.descripcion,
        cantidad_solicitada: detalle.cantidad_solicitada_total,
        cantidad_confirmada: detalle.cantidad_confirmada_total,
        cantidad_distribuida,
        diferencia,
        costo_unitario: detalle.costo_doc_sin_iva_ajustado || detalle.costo_doc_sin_iva_original,
        distribucion_tiendas,
        expandido: false,
        // ⭐ Campos para identificar modificaciones de EL RAYO
        pedido_detalle_id: detalle.pedido_detalle_id,
        costo_modificado_manual: detalle.costo_modificado_manual || false,
        total_modificado_manual: detalle.total_modificado_manual || false
      }
    })
    
    // Recalcular diferencias iniciales
    recalcularDiferencias()
  }

  /**
   * Recalcula diferencias de todos los productos
   */
  function recalcularDiferencias() {
    productosRedistribucion.value.forEach(producto => {
      producto.cantidad_distribuida = producto.distribucion_tiendas.reduce(
        (sum, t) => sum + t.cantidad_asignada, 0
      )
      producto.diferencia = producto.cantidad_distribuida - producto.cantidad_confirmada
      
      // Recalcular diferencias de tiendas
      producto.distribucion_tiendas.forEach(tienda => {
        tienda.diferencia = tienda.cantidad_asignada - tienda.cantidad_original
      })
      
      // Validar y establecer error si existe
      producto.error = validarProducto(producto)
    })
  }

  /**
   * Valida un producto
   */
  function validarProducto(producto: ProductoRedistribucion): string | undefined {
    if (producto.cantidad_distribuida > producto.cantidad_confirmada) {
      return `La suma distribuida (${formatNumber(producto.cantidad_distribuida)}) excede el total confirmado (${formatNumber(producto.cantidad_confirmada)}). Debe reducir las cantidades asignadas.`
    }
    if (producto.distribucion_tiendas.some(t => t.cantidad_asignada < 0)) {
      return 'No se permiten cantidades negativas. Por favor, revise las cantidades asignadas.'
    }
    if (producto.diferencia < 0) {
      return `Faltan ${formatNumber(Math.abs(producto.diferencia))} unidades por distribuir. La suma debe ser exactamente ${formatNumber(producto.cantidad_confirmada)}.`
    }
    return undefined
  }

  /**
   * Valida cantidad de tienda individual
   */
  function validarCantidadTienda(producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada): boolean {
    // No puede ser negativo
    if (tienda.cantidad_asignada < 0) return false
    
    // Calcular suma total actual (sumando todas las tiendas, incluyendo la que se está editando)
    const sumaActual = producto.distribucion_tiendas.reduce((sum, t) => {
      return sum + (t.cantidad_asignada || 0)
    }, 0)
    
    // La suma no puede exceder la cantidad confirmada
    return sumaActual <= producto.cantidad_confirmada
  }

  /**
   * Valida y corrige cantidad al perder el foco
   */
  function validarYCorregirCantidad(producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada) {
    if (!tienda || !producto) return
    
    // Asegurar que no sea negativo
    if (tienda.cantidad_asignada < 0) {
      tienda.cantidad_asignada = 0
    }
    
    // Calcular suma actual
    const sumaActual = producto.distribucion_tiendas.reduce((sum, t) => sum + (t.cantidad_asignada || 0), 0)
    
    // Si excede, ajustar automáticamente la tienda actual para que no exceda
    if (sumaActual > producto.cantidad_confirmada) {
      const exceso = sumaActual - producto.cantidad_confirmada
      tienda.cantidad_asignada = Math.max(0, tienda.cantidad_asignada - exceso)
    }
    
    // Recalcular diferencias
    recalcularDiferencias()
  }

  /**
   * Actualiza tiendas desde reporte de diferencias si está disponible
   */
  function actualizarTiendasDesdeReporte() {
    const reporteDiferencias = options.getReporteDiferencias?.() || options.reporteDiferencias
    if (!reporteDiferencias?.value || productosRedistribucion.value.length === 0) return
    
    productosRedistribucion.value.forEach(producto => {
      const reporteItem = reporteDiferencias.value?.detalle.find(
        r => r.codigo_producto === producto.codigo_producto
      )
      
      if (reporteItem?.distribucion_tiendas && producto.distribucion_tiendas.length === 0) {
        // Si no hay tiendas pero el reporte tiene, agregarlas
        reporteItem.distribucion_tiendas.forEach(t => {
          const existe = producto.distribucion_tiendas.some(t2 => t2.tienda_codigo === t.tienda_codigo)
          if (!existe) {
            producto.distribucion_tiendas.push({
              tienda_codigo: t.tienda_codigo,
              tienda_nombre: t.tienda_nombre,
              cantidad_original: t.cantidad,
              cantidad_asignada: t.cantidad,
              diferencia: 0
            })
          }
        })
      }
    })
    
    recalcularDiferencias()
  }

  /**
   * Toggle expandir producto
   */
  function toggleExpandirProducto(codigoProducto: string) {
    if (productosExpandidos.value.has(codigoProducto)) {
      productosExpandidos.value.delete(codigoProducto)
    } else {
      productosExpandidos.value.add(codigoProducto)
    }
  }

  /**
   * Actualiza cantidad de tienda
   */
  function actualizarCantidadTienda(codigoProducto: string, tiendaCodigo: string, event: Event) {
    const target = event.target as HTMLInputElement
    const nuevoValor = parseFloat(target.value) || 0
    
    const producto = productosRedistribucion.value.find(p => p.codigo_producto === codigoProducto)
    if (!producto) return
    
    const tienda = producto.distribucion_tiendas.find(t => t.tienda_codigo === tiendaCodigo)
    if (!tienda) return
    
    // Validar que no sea negativo
    if (nuevoValor < 0) {
      target.value = '0'
      tienda.cantidad_asignada = 0
    } else {
      tienda.cantidad_asignada = nuevoValor
    }
    
    // Recalcular diferencias
    recalcularDiferencias()
    
    // Si excede el confirmado, mostrar error visual
    if (!validarCantidadTienda(producto, tienda)) {
      target.classList.add('border-red-500')
    } else {
      target.classList.remove('border-red-500')
    }
  }

  /**
   * Distribuye proporcionalmente
   */
  function distribuirProporcionalmente(codigoProducto: string) {
    const producto = productosRedistribucion.value.find(p => p.codigo_producto === codigoProducto)
    if (!producto || producto.distribucion_tiendas.length === 0) return
    
    const totalOriginal = producto.distribucion_tiendas.reduce((sum, t) => sum + t.cantidad_original, 0)
    const cantidadConfirmada = producto.cantidad_confirmada
    
    if (totalOriginal === 0) {
      // Si no hay distribución original, distribuir equitativamente
      const cantidadPorTienda = Math.floor(cantidadConfirmada / producto.distribucion_tiendas.length)
      const resto = cantidadConfirmada % producto.distribucion_tiendas.length
      
      producto.distribucion_tiendas.forEach((tienda, index) => {
        tienda.cantidad_asignada = cantidadPorTienda + (index < resto ? 1 : 0)
      })
    } else {
      // Distribuir proporcionalmente según la distribución original
      producto.distribucion_tiendas.forEach(tienda => {
        const proporcion = tienda.cantidad_original / totalOriginal
        tienda.cantidad_asignada = Math.round(cantidadConfirmada * proporcion)
      })
      
      // Ajustar redondeo: sumar/disminuir la diferencia al primer elemento
      const sumaActual = producto.distribucion_tiendas.reduce((sum, t) => sum + t.cantidad_asignada, 0)
      const diferencia = cantidadConfirmada - sumaActual
      if (diferencia !== 0 && producto.distribucion_tiendas.length > 0) {
        producto.distribucion_tiendas[0].cantidad_asignada += diferencia
      }
    }
    
    recalcularDiferencias()
    toast.info('Distribución actualizada', 'Se ha distribuido proporcionalmente')
  }

  /**
   * Copia distribución original
   */
  function copiarDistribucionOriginal(codigoProducto: string) {
    const producto = productosRedistribucion.value.find(p => p.codigo_producto === codigoProducto)
    if (!producto) return
    
    producto.distribucion_tiendas.forEach(tienda => {
      tienda.cantidad_asignada = tienda.cantidad_original
    })
    
    recalcularDiferencias()
    toast.info('Distribución copiada', 'Se ha restaurado la distribución original')
  }

  /**
   * Resetea distribución
   */
  function resetearDistribucion(codigoProducto: string) {
    const producto = productosRedistribucion.value.find(p => p.codigo_producto === codigoProducto)
    if (!producto) return
    
    producto.distribucion_tiendas.forEach(tienda => {
      tienda.cantidad_asignada = 0
    })
    
    recalcularDiferencias()
    toast.info('Distribución reseteada', 'Todas las cantidades se han establecido en 0')
  }

  /**
   * Guarda borrador de redistribución
   */
  async function guardarBorradorRedistribucion() {
    if (!options.pedido.value || !options.numeroPedido.value) return
    
    guardandoRedistribucion.value = true
    try {
      // TODO: Implementar endpoint para guardar borrador
      // Por ahora, guardar en sessionStorage
      const storageKey = `redistribucion_borrador_${options.numeroPedido.value}`
      sessionStorage.setItem(storageKey, JSON.stringify(productosRedistribucion.value))
      
      toast.success('Borrador guardado', 'La redistribución se ha guardado como borrador')
    } catch (e: any) {
      toast.error('Error al guardar', e.message || 'No se pudo guardar el borrador')
    } finally {
      guardandoRedistribucion.value = false
    }
  }

  /**
   * Confirma redistribución y genera ODC directamente
   * Reutiliza la lógica de procesarOC pero adaptada para pedidos
   */
  async function confirmarRedistribucion(puedeConfirmar: Ref<boolean> | ComputedRef<boolean>) {
    if (!puedeConfirmar.value) {
      toast.warning('Validación requerida', 'Debe completar la redistribución correctamente antes de confirmar')
      return
    }
    
    if (!options.pedido.value || !options.numeroPedido.value) return
    
    confirmandoRedistribucion.value = true
    try {
      // 1. Preparar datos para enviar al backend (guardar redistribución)
      const ajustes_detalle = productosRedistribucion.value.map(producto => ({
        codigo_producto: producto.codigo_producto,
        descripcion: producto.descripcion,
        cantidad_solicitada: producto.cantidad_solicitada,
        cantidad_confirmada: producto.cantidad_confirmada,
        cantidad_ajustada: producto.cantidad_distribuida,
        distribucion_tiendas: producto.distribucion_tiendas.map(t => ({
          tienda_codigo: t.tienda_codigo,
          tienda_nombre: t.tienda_nombre,
          cantidad: t.cantidad_asignada
        })),
        costo_original: producto.costo_unitario,
        costo_ajustado: producto.costo_unitario,
        cambio_precio: false
      }))
      
      // 2. Confirmar redistribución (guarda los ajustes)
      await mba3ConsultasService.confirmarRedistribucion(options.numeroPedido.value, ajustes_detalle)
      
      toast.success('Redistribución confirmada', 'Procesando orden de compra...')
      
      // 3. Generar ODC directamente (reutiliza lógica de procesarOC)
      // El backend aplicará la transformación docenas→unidades SAP automáticamente
      const ocResponse = await mba3ConsultasService.procesarOCDesdePedido(options.numeroPedido.value)
      
      // 4. Manejar respuesta similar a procesarOC
      if (ocResponse?.metadata?.oc_status) {
        const ocStatus = ocResponse.metadata.oc_status
        
        if (ocStatus.status === 'completed') {
          toast.success(
            'ODC generada exitosamente',
            `Orden de compra creada con ${ocStatus.oc_creadas || 1} artículo(s)`
          )
        } else if (ocStatus.status === 'partial') {
          toast.warning(
            'ODC generada parcialmente',
            `${ocStatus.oc_creadas} artículo(s) procesado(s), ${ocStatus.oc_errores} con errores`
          )
        } else if (ocStatus.status === 'processing') {
          toast.info(
            'ODC en proceso',
            'La orden de compra se está generando. Revisa el estado en "Procesar ODC"'
          )
        }
      } else {
        toast.success('ODC generada', 'La orden de compra se ha generado exitosamente')
      }
      
      // 5. Recargar pedido para actualizar datos
      if (options.loadPedido) {
        await options.loadPedido()
      }
      
      // 6. Cargar reporte de diferencias
      if (options.loadReporteDiferencias) {
        await options.loadReporteDiferencias()
      }
    } catch (e: any) {
      console.error('Error al confirmar redistribución y generar ODC:', e)
      toast.error('Error al procesar', e.message || 'No se pudo confirmar la redistribución o generar la ODC')
    } finally {
      confirmandoRedistribucion.value = false
    }
  }

  return {
    // Estado
    productosRedistribucion,
    productosExpandidos,
    guardandoRedistribucion,
    confirmandoRedistribucion,
    
    // Funciones
    inicializarProductosRedistribucion,
    recalcularDiferencias,
    validarProducto,
    validarCantidadTienda,
    validarYCorregirCantidad,
    actualizarTiendasDesdeReporte,
    toggleExpandirProducto,
    actualizarCantidadTienda,
    distribuirProporcionalmente,
    copiarDistribucionOriginal,
    resetearDistribucion,
    guardarBorradorRedistribucion,
    confirmarRedistribucion
  }
}
