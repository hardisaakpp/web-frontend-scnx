/**
 * Composable para manejar la redistribución de productos a tiendas
 */
import { ref, Ref, type ComputedRef, triggerRef } from 'vue'
import { useRouter } from 'vue-router'
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
  const router = useRouter()

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
      const cantidad_distribuida = producto.distribucion_tiendas.reduce(
        (sum, t) => sum + t.cantidad_asignada, 0
      )
      const diferencia = cantidad_distribuida - producto.cantidad_confirmada
      
      // Actualizar propiedades para asegurar reactividad
      producto.cantidad_distribuida = cantidad_distribuida
      producto.diferencia = diferencia
      
      // Recalcular diferencias de tiendas
      producto.distribucion_tiendas.forEach(tienda => {
        tienda.diferencia = tienda.cantidad_asignada - tienda.cantidad_original
      })
      
      // Validar y establecer error si existe
      producto.error = validarProducto(producto)
    })
    
    // Forzar actualización de reactividad para asegurar que Vue detecte los cambios
    triggerRef(productosRedistribucion)
  }

  /**
   * Valida un producto
   * ⭐ MEJORADO: Validaciones más estrictas (enteros, rangos, formato)
   */
  function validarProducto(producto: ProductoRedistribucion): string | undefined {
    // Validar que la cantidad distribuida no exceda la confirmada
    if (producto.cantidad_distribuida > producto.cantidad_confirmada) {
      const exceso = producto.cantidad_distribuida - producto.cantidad_confirmada
      return `La suma distribuida (${formatNumber(producto.cantidad_distribuida)}) excede el total confirmado (${formatNumber(producto.cantidad_confirmada)}) por ${formatNumber(exceso)} unidades. Debe reducir las cantidades asignadas.`
    }
    
    // Validar cantidades negativas
    if (producto.distribucion_tiendas.some(t => t.cantidad_asignada < 0)) {
      return 'No se permiten cantidades negativas. Por favor, revise las cantidades asignadas.'
    }
    
    // Validar que todas las cantidades sean enteros (no decimales)
    const tieneDecimales = producto.distribucion_tiendas.some(t => {
      const cantidad = t.cantidad_asignada
      return cantidad % 1 !== 0
    })
    if (tieneDecimales) {
      return 'Las cantidades asignadas deben ser números enteros (sin decimales). Por favor, corrija los valores decimales.'
    }
    
    // Validar que la cantidad distribuida total sea entero
    if (producto.cantidad_distribuida % 1 !== 0) {
      return `La suma total distribuida (${producto.cantidad_distribuida}) debe ser un número entero.`
    }
    
    // Validar rangos razonables (máximo 1,000,000 por tienda)
    const excedeLimite = producto.distribucion_tiendas.some(t => t.cantidad_asignada > 1000000)
    if (excedeLimite) {
      return 'Una o más cantidades asignadas exceden el límite máximo permitido (1,000,000 unidades por tienda).'
    }
    
    // Validar que no falte distribuir
    if (producto.diferencia < 0) {
      return `Faltan ${formatNumber(Math.abs(producto.diferencia))} unidades por distribuir. La suma debe ser exactamente ${formatNumber(producto.cantidad_confirmada)}.`
    }
    
    return undefined
  }

  /**
   * Valida cantidad de tienda individual
   * ⭐ MEJORADO: Validaciones más estrictas (enteros, rangos)
   */
  function validarCantidadTienda(producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada): boolean {
    const cantidad = tienda.cantidad_asignada
    
    // No puede ser negativo
    if (cantidad < 0) return false
    
    // Debe ser un número entero (no decimal)
    if (cantidad % 1 !== 0) return false
    
    // No puede exceder el límite máximo por tienda
    if (cantidad > 1000000) return false
    
    // Calcular suma total actual (sumando todas las tiendas, incluyendo la que se está editando)
    const sumaActual = producto.distribucion_tiendas.reduce((sum, t) => {
      return sum + (t.cantidad_asignada || 0)
    }, 0)
    
    // La suma no puede exceder la cantidad confirmada
    return sumaActual <= producto.cantidad_confirmada
  }

  /**
   * Valida y corrige cantidad al perder el foco
   * ⭐ MEJORADO: Validaciones y correcciones más robustas con feedback al usuario
   */
  function validarYCorregirCantidad(producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada) {
    if (!tienda || !producto) return
    
    let valorCorregido = false
    let mensajeCorreccion = ''
    
    // Asegurar que no sea negativo
    if (tienda.cantidad_asignada < 0) {
      tienda.cantidad_asignada = 0
      valorCorregido = true
      mensajeCorreccion = 'Cantidad negativa corregida a 0'
    }
    
    // Asegurar que sea entero (redondear si es decimal)
    if (tienda.cantidad_asignada % 1 !== 0) {
      tienda.cantidad_asignada = Math.round(tienda.cantidad_asignada)
      valorCorregido = true
      mensajeCorreccion = 'Cantidad decimal redondeada a número entero'
    }
    
    // Validar límite máximo
    if (tienda.cantidad_asignada > 1000000) {
      tienda.cantidad_asignada = 1000000
      valorCorregido = true
      mensajeCorreccion = 'Cantidad ajustada al límite máximo (1,000,000)'
    }
    
    // Calcular suma actual
    const sumaActual = producto.distribucion_tiendas.reduce((sum, t) => sum + (t.cantidad_asignada || 0), 0)
    
    // Si excede, ajustar automáticamente la tienda actual para que no exceda
    if (sumaActual > producto.cantidad_confirmada) {
      const exceso = sumaActual - producto.cantidad_confirmada
      const nuevoValor = Math.max(0, tienda.cantidad_asignada - exceso)
      tienda.cantidad_asignada = nuevoValor
      valorCorregido = true
      mensajeCorreccion = `Cantidad ajustada para no exceder el total confirmado (${formatNumber(producto.cantidad_confirmada)}). Se redujo en ${formatNumber(exceso)} unidades.`
    }
    
    // Mostrar feedback si se corrigió algo
    if (valorCorregido && mensajeCorreccion) {
      toast.info('Valor corregido', mensajeCorreccion)
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
   * Obtiene el nombre de una tienda desde otras fuentes si no está disponible
   * Busca en: otros productos, pedido original, reporte de diferencias
   */
  function obtenerNombreTienda(tiendaCodigo: string): string {
    // 1. Buscar en otros productos que ya tienen esta tienda
    for (const producto of productosRedistribucion.value) {
      const tiendaExistente = producto.distribucion_tiendas.find(t => t.tienda_codigo === tiendaCodigo)
      if (tiendaExistente) {
        return tiendaExistente.tienda_nombre
      }
    }
    
    // 2. Buscar en el pedido original
    if (options.pedido.value?.detalles) {
      for (const detalle of options.pedido.value.detalles) {
        const tiendaOriginal = detalle.tiendas?.find(t => t.codigo === tiendaCodigo)
        if (tiendaOriginal?.nombre) {
          return tiendaOriginal.nombre
        }
      }
    }
    
    // 3. Buscar en reporte de diferencias
    const reporteDiferencias = options.getReporteDiferencias?.() || options.reporteDiferencias
    if (reporteDiferencias?.value?.detalle) {
      for (const item of reporteDiferencias.value.detalle) {
        const tiendaReporte = item.distribucion_tiendas?.find(t => t.tienda_codigo === tiendaCodigo)
        if (tiendaReporte?.tienda_nombre) {
          return tiendaReporte.tienda_nombre
        }
      }
    }
    
    // 4. Si no se encuentra, usar el código como nombre
    return tiendaCodigo
  }

  /**
   * Actualiza cantidad de tienda
   * ⭐ MEJORADO: Validaciones mejoradas (enteros, rangos, formato de tienda)
   */
  function actualizarCantidadTienda(codigoProducto: string, tiendaCodigo: string, event: Event) {
    const target = event.target as HTMLInputElement
    let nuevoValor = parseFloat(target.value) || 0
    
    const producto = productosRedistribucion.value.find(p => p.codigo_producto === codigoProducto)
    if (!producto) return
    
    // ⭐ VALIDACIÓN: Validar formato del código de tienda
    if (!tiendaCodigo || typeof tiendaCodigo !== 'string' || tiendaCodigo.trim().length === 0) {
      toast.warning('Código de tienda inválido', 'El código de tienda no puede estar vacío')
      return
    }
    
    // Buscar la tienda existente
    let tienda = producto.distribucion_tiendas.find(t => t.tienda_codigo === tiendaCodigo)
    
    // ⭐ Si la tienda no existe, crearla automáticamente
    if (!tienda) {
      const nombreTienda = obtenerNombreTienda(tiendaCodigo)
      tienda = {
        tienda_codigo: tiendaCodigo,
        tienda_nombre: nombreTienda,
        cantidad_original: 0, // Nueva tienda, no tenía distribución original
        cantidad_asignada: 0,
        diferencia: 0
      }
      producto.distribucion_tiendas.push(tienda)
    }
    
    // ⭐ VALIDACIÓN MEJORADA: Validar y corregir valor
    if (isNaN(nuevoValor) || nuevoValor < 0) {
      target.value = '0'
      tienda.cantidad_asignada = 0
    } else {
      // ⭐ Validar que sea entero (redondear si es decimal)
      if (nuevoValor % 1 !== 0) {
        nuevoValor = Math.round(nuevoValor)
        target.value = nuevoValor.toString()
        toast.info('Valor ajustado', 'Las cantidades deben ser números enteros. Se ha redondeado automáticamente.')
      }
      
      // ⭐ Validar límite máximo
      if (nuevoValor > 1000000) {
        nuevoValor = 1000000
        target.value = '1000000'
        toast.warning('Límite máximo', 'La cantidad máxima permitida por tienda es 1,000,000 unidades')
      }
      
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
   * Confirma redistribución
   * El backend procesa automáticamente la información SAP y transforma unidades
   * Después de confirmar, redirige a la interfaz de Procesos de Integración MBA3-SAP
   * ⭐ MEJORADO: Validación previa más detallada con mensajes específicos
   */
  async function confirmarRedistribucion(puedeConfirmar: Ref<boolean> | ComputedRef<boolean>) {
    if (!puedeConfirmar.value) {
      // ⭐ MEJORADO: Mensaje de error más específico
      const productosConError = productosRedistribucion.value.filter(p => p.error || p.diferencia !== 0)
      
      if (productosConError.length > 0) {
        const errores = productosConError.map(p => {
          if (p.error) return `${p.codigo_producto}: ${p.error}`
          if (p.diferencia < 0) return `${p.codigo_producto}: Faltan ${formatNumber(Math.abs(p.diferencia))} unidades por distribuir`
          if (p.diferencia > 0) return `${p.codigo_producto}: Excede por ${formatNumber(p.diferencia)} unidades`
          return `${p.codigo_producto}: Error de validación`
        })
        
        toast.error(
          'Validación requerida', 
          `Hay ${productosConError.length} producto(s) con errores:\n${errores.slice(0, 3).join('\n')}${errores.length > 3 ? '\n...' : ''}`
        )
      } else {
        toast.warning('Validación requerida', 'Debe completar la redistribución correctamente antes de confirmar')
      }
      return
    }
    
    if (!options.pedido.value || !options.numeroPedido.value) return
    
    confirmandoRedistribucion.value = true
    try {
      // 1. Preparar datos para enviar al backend
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
      
      // 2. Confirmar redistribución
      // El backend procesa automáticamente:
      // - Consulta SAP para cada producto
      // - Calcula conversiones de cantidades y precios
      // - Detecta productos no homologados
      // - Guarda en pedido_sap_procesamiento_detalle
      await mba3ConsultasService.confirmarRedistribucion(options.numeroPedido.value, ajustes_detalle)
      
      toast.success(
        'Redistribución confirmada',
        'Procesando información SAP y transformando unidades...'
      )
      
      // 3. Recargar pedido para actualizar datos
      if (options.loadPedido) {
        await options.loadPedido()
      }
      
      // 4. Cargar reporte de diferencias
      if (options.loadReporteDiferencias) {
        await options.loadReporteDiferencias()
      }
      
      // 5. Redirigir a la nueva vista de procesamiento SAP
      // Mostrando la información del pedido confirmado y los detalles del procesamiento SAP
      router.push({
        name: 'mba3-consultas-pedido-procesamiento-sap',
        params: { id: encodeURIComponent(options.numeroPedido.value) }
      })
    } catch (e: any) {
      console.error('Error al confirmar redistribución:', e)
      toast.error('Error al confirmar', e.message || 'No se pudo confirmar la redistribución')
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
