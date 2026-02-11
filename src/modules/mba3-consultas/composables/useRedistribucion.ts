/**
 * Composable para manejar la redistribución de productos a tiendas
 */
import { ref, Ref, type ComputedRef, triggerRef } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { formatNumber } from '../utils/formatters'
import type { ProductoRedistribucion, DistribucionTiendaEditada } from '../utils/redistribucionHelpers'
import { esBodega } from '../utils/redistribucionHelpers'
import type { PedidoCompleto, ReporteDiferenciasResponse, DistribucionPedidoResponse, AjusteDetalle } from '../types'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'

export function useRedistribucion(options: {
  pedido: Ref<PedidoCompleto | null>
  numeroPedido: Ref<string>
  /** Obsoleto en vista detalle de pedido. Si no se pasa, no afecta. */
  esModoMabelTrading?: Ref<boolean>
  reporteDiferencias?: Ref<ReporteDiferenciasResponse | null>
  getReporteDiferencias?: () => Ref<ReporteDiferenciasResponse | null>
  loadPedido?: () => Promise<void>
  loadReporteDiferencias?: () => Promise<void>
}) {
  const toast = useToast()
  const router = useRouter()
  const authStore = useAuthStore()

  const productosRedistribucion = ref<ProductoRedistribucion[]>([])
  const productosExpandidos = ref<Set<string>>(new Set())
  const guardandoRedistribucion = ref(false)
  const confirmandoRedistribucion = ref(false)

  /**
   * Mapea la respuesta de GET /api/pedidos/{pedido_id}/distribucion a ProductoRedistribucion[].
   * Opcionalmente toma costo y flags de pedido.respuesta_proveedor si existe.
   */
  function mapDistribucionResponseToProductos(data: DistribucionPedidoResponse): ProductoRedistribucion[] {
    const detallesRespuesta = options.pedido.value?.respuesta_proveedor?.detalles ?? []
    return data.productos.map(p => {
      const detalleRespuesta = detallesRespuesta.find(d => d.codigo_producto === p.codigo_interno)
      const costo = detalleRespuesta?.costo_doc_sin_iva_ajustado ?? detalleRespuesta?.costo_doc_sin_iva_original ?? null
      const distribucion_tiendas: DistribucionTiendaEditada[] = (p.distribuciones ?? []).map(d => {
        const cantidadOriginal = d.cantidad_confirmada ?? d.cantidad_asignada ?? 0
        return {
          tienda_codigo: d.tienda_codigo,
          tienda_nombre: d.tienda_nombre ?? d.tienda_codigo,
          cantidad_original: cantidadOriginal,
          cantidad_asignada: d.cantidad_asignada,
          diferencia: (d.cantidad_asignada ?? 0) - cantidadOriginal,
          es_bodega: esBodega(d.tienda_codigo)
        }
      })
      const cantidad_distribuida = p.cantidad_asignada_total ?? distribucion_tiendas.reduce((sum, t) => sum + t.cantidad_asignada, 0)
      const diferencia = cantidad_distribuida - p.cantidad_confirmada_total
      return {
        codigo_producto: p.codigo_interno,
        descripcion: p.descripcion_sap ?? p.codigo_interno,
        cantidad_solicitada: p.cantidad_solicitada_total,
        cantidad_confirmada: p.cantidad_confirmada_total,
        cantidad_distribuida,
        diferencia,
        costo_unitario: costo,
        distribucion_tiendas,
        expandido: false,
        pedido_detalle_id: p.pedido_detalle_id,
        costo_modificado_manual: detalleRespuesta?.costo_modificado_manual ?? false,
        total_modificado_manual: detalleRespuesta?.total_modificado_manual ?? false
      }
    })
  }

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
        diferencia: 0,
        es_bodega: esBodega(tienda.codigo) // Marcar si es bodega
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
              diferencia: 0,
              es_bodega: esBodega(t.tienda_codigo) // Marcar si es bodega
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
   * Mapea ajustes_detalle (BorradorResponse de GET .../redistribucion/inicial?solo_lectura=1) a ProductoRedistribucion[].
   */
  function mapAjustesDetalleToProductos(ajustes: AjusteDetalle[]): ProductoRedistribucion[] {
    return ajustes.map(a => {
      const distribucion_tiendas: DistribucionTiendaEditada[] = (a.distribucion_tiendas ?? []).map(t => {
        const cantidad = t.cantidad ?? 0
        return {
          tienda_codigo: t.tienda_codigo,
          tienda_nombre: t.tienda_nombre ?? t.tienda_codigo,
          cantidad_original: cantidad,
          cantidad_asignada: cantidad,
          diferencia: 0,
          es_bodega: esBodega(t.tienda_codigo)
        }
      })
      const cantidad_distribuida = a.cantidad_ajustada ?? distribucion_tiendas.reduce((sum, t) => sum + t.cantidad_asignada, 0)
      const diferencia = cantidad_distribuida - a.cantidad_confirmada
      return {
        codigo_producto: a.codigo_producto,
        descripcion: a.descripcion ?? a.codigo_producto,
        cantidad_solicitada: a.cantidad_solicitada,
        cantidad_confirmada: a.cantidad_confirmada,
        cantidad_distribuida,
        diferencia,
        costo_unitario: a.costo_ajustado ?? a.costo_original ?? null,
        distribucion_tiendas,
        expandido: false
      }
    })
  }

  /**
   * Carga la última redistribución confirmada para vista solo lectura.
   * Llama a GET /api/pedidos/{numero_pedido}/redistribucion/inicial?solo_lectura=1.
   */
  async function cargarRedistribucionSoloLectura(): Promise<void> {
    const numero = options.numeroPedido.value
    if (!numero) {
      productosRedistribucion.value = []
      return
    }
    const data = await mba3ConsultasService.getRedistribucionInicial(numero, true)
    if (data?.ajustes_detalle?.length) {
      productosRedistribucion.value = mapAjustesDetalleToProductos(data.ajustes_detalle)
      recalcularDiferencias()
    } else {
      productosRedistribucion.value = []
    }
  }

  /**
   * Carga la redistribución con la siguiente prioridad:
   * 1. Primero intenta cargar un BORRADOR guardado (permite continuar trabajo en progreso)
   * 2. Si no hay borrador, intenta cargar la distribución confirmada desde GET /api/pedidos/{pedido_id}/distribucion
   * 3. Si no hay nada guardado, inicializa desde respuesta_proveedor + pedido.detalles
   * 
   * Esta prioridad garantiza que el usuario no pierda su progreso si guardó un borrador
   * antes de refrescar la página o si el token expiró.
   */
  async function cargarYInicializarRedistribucion(): Promise<void> {
    const numeroPedido = options.numeroPedido.value
    const pedidoId = options.pedido.value?.cabecera?.pedido_id

    // 1. Primero intentar cargar borrador guardado (prioridad máxima)
    // Solo usuarios con mabel.view pueden tener borradores (odcsap.view no crea borradores)
    // ⭐ FIX: Usar fallback a permisos persistidos (localStorage) para evitar race condition
    // en reload completo (F5), donde capabilities aún no están cargadas cuando se ejecuta
    // esta función. authStore.canViewMabel depende de capabilities (GET /Auth/me),
    // pero hasPermission('mabel.view') lee de userPermissions que tiene fallback a localStorage.
    const tieneMabelView = authStore.canViewMabel || authStore.hasPermission('mabel.view')
    if (numeroPedido && tieneMabelView) {
      const borradorCargado = await cargarBorradorSiExiste()
      if (borradorCargado) {
        if (import.meta.env.DEV) {
          console.log('📦 [cargarYInicializarRedistribucion] Usando borrador guardado')
        }
        return
      }
    }

    // 2. Si no hay borrador, intentar cargar distribución confirmada
    if (pedidoId) {
      try {
        const data = await mba3ConsultasService.getDistribucion(pedidoId)
        if (data?.productos?.length > 0) {
          productosRedistribucion.value = mapDistribucionResponseToProductos(data)
          recalcularDiferencias()
          if (import.meta.env.DEV) {
            console.log('📦 [cargarYInicializarRedistribucion] Usando distribución confirmada')
          }
          return
        }
      } catch (_) {
        // Sin distribución guardada o error: seguir con inicialización desde pedido
      }
    }

    // 3. Inicializar desde respuesta_proveedor + pedido.detalles (datos originales)
    if (import.meta.env.DEV) {
      console.log('📦 [cargarYInicializarRedistribucion] Inicializando desde datos originales del pedido')
    }
    inicializarProductosRedistribucion()
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
    
    // ⭐ ACTUALIZADO: Permitir que el total exceda la cantidad confirmada cuando hay bodegas
    // Ya que las bodegas no se ajustan automáticamente, el usuario puede aumentar tiendas
    // sin que se reste de las bodegas, lo que puede hacer que el total exceda lo confirmado
    // Esto es válido porque las bodegas mantienen su valor original
    const tieneBodegas = producto.distribucion_tiendas.some(t => t.es_bodega && (t.cantidad_asignada || 0) > 0)
    
    // Si hay bodegas, permitir que el total exceda (el usuario debe ajustar manualmente las bodegas)
    // Si no hay bodegas, mantener la validación estricta
    if (tieneBodegas) {
      // Con bodegas: permitir exceder (advertencia visual, no bloqueo)
      return true
    } else {
      // Sin bodegas: validación estricta (no puede exceder)
      return sumaActual <= producto.cantidad_confirmada
    }
  }

  /**
   * Valida cantidad al perder el foco (sin corrección automática)
   * Solo aplica correcciones mínimas para valores inválidos (negativos, decimales)
   * NO ajusta automáticamente cuando excede el total confirmado - el usuario tiene control total
   */
  function validarYCorregirCantidad(producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada) {
    if (!tienda || !producto) return
    
    let valorCorregido = false
    let mensajeCorreccion = ''
    
    // Solo corregir valores claramente inválidos (negativos)
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
    
    // Validar límite máximo (protección contra valores absurdos)
    if (tienda.cantidad_asignada > 1000000) {
      tienda.cantidad_asignada = 1000000
      valorCorregido = true
      mensajeCorreccion = 'Cantidad ajustada al límite máximo (1,000,000)'
    }
    
    // ⭐ ELIMINADO: Ya NO se ajusta automáticamente cuando excede el total confirmado
    // El usuario tiene control total sobre los valores y verá el indicador visual de error
    // en la columna "Diferencia" si el total distribuido excede el confirmado
    
    // Mostrar feedback si se corrigió algo
    if (valorCorregido && mensajeCorreccion) {
      toast.info('Valor corregido', mensajeCorreccion)
    }
    
    // Recalcular diferencias (solo para actualizar indicadores visuales)
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
              diferencia: 0,
              es_bodega: esBodega(t.tienda_codigo) // Marcar si es bodega
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
   * ⭐ DESHABILITADO: Ajuste automático de bodegas
   * 
   * Esta función ya no se usa porque el backend retiró la funcionalidad de restar
   * automáticamente de las bodegas cuando se redistribuye a tiendas.
   * Las bodegas ahora mantienen sus valores originales.
   * 
   * @deprecated Ya no se ajustan automáticamente las bodegas
   */
  // function ajustarBodegasAutomaticamente(producto: ProductoRedistribucion, tiendaModificada: DistribucionTiendaEditada, diferencia: number) {
  //   // Si la tienda modificada es bodega, no ajustar
  //   if (tiendaModificada.es_bodega) return
  //   
  //   // Obtener todas las bodegas del producto
  //   const bodegas = producto.distribucion_tiendas.filter(t => t.es_bodega && t.tienda_codigo !== tiendaModificada.tienda_codigo)
  //   
  //   if (bodegas.length === 0) return
  //   
  //   // Calcular la diferencia que necesita ajustarse en las bodegas
  //   // Si aumentó la tienda, disminuir bodegas. Si disminuyó, aumentar bodegas.
  //   const diferenciaBodegas = -diferencia // Invertir para compensar
  //   
  //   // Si hay múltiples bodegas, distribuir proporcionalmente según su cantidad actual
  //   const totalBodegas = bodegas.reduce((sum, b) => sum + Math.max(0, b.cantidad_asignada), 0)
  //   
  //   if (totalBodegas > 0) {
  //     // Distribuir proporcionalmente
  //     let diferenciaRestante = diferenciaBodegas
  //     bodegas.forEach((bodega, index) => {
  //       if (index === bodegas.length - 1) {
  //         // La última bodega recibe el resto para evitar errores de redondeo
  //         bodega.cantidad_asignada = Math.max(0, bodega.cantidad_asignada + diferenciaRestante)
  //       } else {
  //         const proporcion = Math.max(0, bodega.cantidad_asignada) / totalBodegas
  //         const ajuste = Math.round(diferenciaBodegas * proporcion)
  //         bodega.cantidad_asignada = Math.max(0, bodega.cantidad_asignada + ajuste)
  //         diferenciaRestante -= ajuste
  //       }
  //     })
  //   } else {
  //     // Si todas las bodegas están en 0, distribuir equitativamente
  //     const ajustePorBodega = Math.round(diferenciaBodegas / bodegas.length)
  //     const resto = diferenciaBodegas % bodegas.length
  //     
  //     bodegas.forEach((bodega, index) => {
  //       if (index === 0) {
  //         // La primera bodega recibe el resto
  //         bodega.cantidad_asignada = Math.max(0, ajustePorBodega + resto)
  //       } else {
  //         bodega.cantidad_asignada = Math.max(0, ajustePorBodega)
  //       }
  //     })
  //   }
  // }

  /**
   * Actualiza cantidad de tienda o bodega
   * ⭐ MEJORADO: Validaciones mejoradas (enteros, rangos, formato de tienda)
   * ⭐ INDEPENDENCIA: Bodegas y tiendas son independientes - cada columna se puede
   *    modificar libremente sin afectar a las demás
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
    
    // Guardar valor anterior para calcular diferencia
    const valorAnterior = tienda?.cantidad_asignada || 0
    
    // ⭐ Si la tienda no existe, crearla automáticamente
    if (!tienda) {
      const nombreTienda = obtenerNombreTienda(tiendaCodigo)
      tienda = {
        tienda_codigo: tiendaCodigo,
        tienda_nombre: nombreTienda,
        cantidad_original: 0, // Nueva tienda, no tenía distribución original
        cantidad_asignada: 0,
        diferencia: 0,
        es_bodega: esBodega(tiendaCodigo) // Marcar si es bodega
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
    
    // ⭐ INDEPENDENCIA: Bodegas y tiendas son independientes
    // - Al modificar una tienda, no se ajustan las bodegas
    // - Al modificar una bodega, no se ajustan las tiendas
    // - Cada columna se puede aumentar o reducir libremente sin afectar a las demás
    // El usuario es responsable de asegurar que las cantidades sean correctas
    
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
   * Guarda borrador de redistribución en el backend
   * 
   * Permite al usuario guardar su progreso sin confirmar la redistribución.
   * Los datos se persisten en la base de datos, no en sessionStorage,
   * por lo que se mantienen incluso si la página se refresca o el token expira.
   */
  async function guardarBorradorRedistribucion() {
    if (!options.pedido.value || !options.numeroPedido.value) return
    
    guardandoRedistribucion.value = true
    try {
      // Preparar datos para enviar al backend
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

      // Llamar al endpoint del backend para guardar el borrador
      await mba3ConsultasService.guardarBorradorRedistribucion(
        options.numeroPedido.value,
        ajustes_detalle
      )
      
      toast.success('Borrador guardado', 'La redistribución se ha guardado. Puede continuar más tarde sin perder el progreso.')
    } catch (e: any) {
      console.error('Error al guardar borrador:', e)
      toast.error('Error al guardar', e.message || 'No se pudo guardar el borrador')
    } finally {
      guardandoRedistribucion.value = false
    }
  }

  /**
   * Intenta cargar un borrador guardado previamente desde el backend.
   * Si existe un borrador, lo aplica a productosRedistribucion.
   * 
   * @returns true si se cargó un borrador, false si no había borrador
   */
  async function cargarBorradorSiExiste(): Promise<boolean> {
    const numero = options.numeroPedido.value
    if (!numero) return false

    try {
      const borrador = await mba3ConsultasService.obtenerBorradorRedistribucion(numero)
      
      // Verificar si hay datos en el borrador
      if (borrador.ajustes_detalle && borrador.ajustes_detalle.length > 0) {
        // Aplicar los datos del borrador
        productosRedistribucion.value = mapAjustesDetalleToProductos(borrador.ajustes_detalle)
        recalcularDiferencias()
        
        // Notificar al usuario que se restauró el borrador
        const fechaGuardado = borrador.fecha_guardado 
          ? new Date(borrador.fecha_guardado).toLocaleString('es-CO', { 
              dateStyle: 'short', 
              timeStyle: 'short' 
            })
          : 'fecha desconocida'
        
        toast.info('Borrador recuperado', `Se ha restaurado el borrador guardado el ${fechaGuardado}`)
        
        if (import.meta.env.DEV) {
          console.log(`📦 [useRedistribucion] Borrador cargado desde backend para ${numero}`)
          console.log(`   Fecha: ${fechaGuardado}`)
          console.log(`   Productos: ${borrador.ajustes_detalle.length}`)
        }
        
        return true
      }
      
      return false
    } catch (e: any) {
      // Si hay error al cargar el borrador, simplemente continuar sin él
      console.warn('⚠️ [useRedistribucion] No se pudo cargar borrador:', e.message)
      return false
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
      
      // 2. Confirmar redistribución (el backend procesa hasta terminar; el modal bloquea la pantalla hasta que responda)
      // El backend procesa automáticamente:
      // - Consulta SAP para cada producto
      // - Calcula conversiones de cantidades y precios
      // - Detecta productos no homologados
      // - Guarda en pedido_sap_procesamiento_detalle
      await mba3ConsultasService.confirmarRedistribucion(options.numeroPedido.value, ajustes_detalle)

      // Actualizar estado del pedido en memoria para que el botón quede deshabilitado (docs/FRONTEND.md §1.3.1)
      const cabecera = options.pedido.value?.cabecera
      if (cabecera) {
        cabecera.estado_id = 10
        cabecera.estado = 'CONFIRMADO REDISTRIBUCION'
      }

      // 3. Refrescar estado con la distribución guardada (GET distribucion) antes de redirigir
      const pedidoId = options.pedido.value?.cabecera?.pedido_id
      if (pedidoId) {
        try {
          const data = await mba3ConsultasService.getDistribucion(pedidoId)
          if (data?.productos?.length > 0) {
            productosRedistribucion.value = mapDistribucionResponseToProductos(data)
            recalcularDiferencias()
          }
        } catch (_) {
          // Ignorar: ya confirmado, redirigimos igual
        }
      }

      // 4. Redirigir a procesamiento SAP en cuanto el backend termina (modal desaparece al cambiar de vista)
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
    cargarYInicializarRedistribucion,
    cargarRedistribucionSoloLectura,
    cargarBorradorSiExiste,
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
