/**
 * Composable para gestionar la edición inline de columnas (costo, total, comentario)
 */
import { ref, Ref, computed } from '@vue/reactivity'
import { nextTick } from '@vue/runtime-core'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { formatCurrency, formatNumber } from '../utils/formatters'
import type { PedidoCompleto } from '../types'

export interface EditingCell {
  detalleId: string
  value: string
  originalValue: number | string | null
  fieldType: 'costo' | 'total' | 'comentario'
}

/** Mapea la key de columna a su fieldType de edición (columnas editables inline). */
const FIELD_TYPE_POR_COLUMNA: Record<string, EditingCell['fieldType']> = {
  costo_doc_sin_iva: 'costo',
  total: 'total',
  comentario: 'comentario'
}

export function useColumnManagement(
  pedido: Ref<PedidoCompleto | null>,
  numeroPedido: Ref<string>,
  columnasModificadas?: Ref<Set<string>>,
  rolesModificacion?: Ref<Map<string, string | null>>,
  getOrderedColumnKeys?: () => string[]
) {
  const toast = useToast()
  const editingCell = ref<EditingCell | null>(null)
  let editingInputElement: HTMLInputElement | null = null
  // Al navegar con Tab, cerrar la celda actual desmonta su <input> y el navegador dispara
  // un blur nativo sobre él (que también llama a guardarEdicion). Para entonces editingCell
  // ya apunta a la celda nueva recién abierta, así que ese blur tardío la cerraría de inmediato.
  // Este flag suprime guardarEdicion() mientras dura esa transición.
  let avanzandoConTab = false

  /**
   * Crea la clave para identificar una columna modificada
   */
  function getColumnaModificadaKey(detalleId: string, columnKey: string): string {
    return `${detalleId}:${columnKey}`
  }

  /**
   * Verifica si una columna está marcada como modificada
   */
  function isColumnaModificada(detalleId: string, columnKey: string): boolean {
    if (!columnasModificadas) return false
    return columnasModificadas.value.has(getColumnaModificadaKey(detalleId, columnKey))
  }

  /**
   * Rol responsable de la última modificación de una columna ('PRODUCCION_ELRAYO' | 'ODCSAP' | null).
   */
  function getRolModificador(detalleId: string, columnKey: string): string | null {
    if (!rolesModificacion) return null
    return rolesModificacion.value.get(getColumnaModificadaKey(detalleId, columnKey)) ?? null
  }

  /**
   * Rol responsable de una edición hecha AHORA, según el estado del pedido: GESTIONAR_PEDIDO
   * es editable en la práctica solo por produccion-elrayo.view y CONFIRMADO_POR_PRODUCCION solo
   * por odcsap.view (mismo criterio que puedeEditarCostoTotalComentario en PedidoDetalleView.vue).
   */
  const rolActualPorEstado = computed<string | null>(() => {
    const cabecera = pedido.value?.cabecera
    if (!cabecera) return null
    const estadoId = cabecera.estado_id != null ? Number(cabecera.estado_id) : null
    const estado = String(cabecera.estado ?? '').trim().toUpperCase()
    if (estadoId === 3 || estado === 'GESTIONAR_PEDIDO' || estado === 'GESTIONAR PEDIDO') return 'PRODUCCION_ELRAYO'
    if (estadoId === 23) return 'ODCSAP'
    return null
  })

  /**
   * Marca una columna como modificada
   */
  function marcarColumnaModificada(detalleId: string, columnKey: string) {
    if (columnasModificadas) {
      columnasModificadas.value.add(getColumnaModificadaKey(detalleId, columnKey))
    }
    if (rolesModificacion) {
      rolesModificacion.value.set(getColumnaModificadaKey(detalleId, columnKey), rolActualPorEstado.value)
    }
  }

  /**
   * Guarda una modificación en el backend (solo la celda recién editada; el
   * backend deriva y persiste el rol responsable según el estado del pedido).
   * El backend espera numero_pedido en la URL, no pedido_id (UUID).
   */
  async function guardarModificacionEnBackend(detalleId: string, columnKey: string) {
    const numeroParaApi = pedido.value?.cabecera?.numero_pedido ?? numeroPedido.value
    if (!numeroParaApi) return

    try {
      await mba3ConsultasService.guardarModificacionesColumnas(
        numeroParaApi,
        [{ pedido_detalle_id: detalleId, columna_key: columnKey }]
      )
    } catch (error: any) {
      // No mostrar error al usuario, solo loguear
      // El resaltado seguirá funcionando localmente
      console.warn('⚠️ [useColumnManagement] No se pudo guardar modificación en backend:', error.message)
    }
  }

  /**
   * Inicia la edición de una celda
   */
  function iniciarEdicion(detalle: any, fieldType: 'costo' | 'total' | 'comentario' = 'costo') {
    if (!pedido.value) return
    
    let value: string
    let originalValue: number | string | null
    
    if (fieldType === 'costo') {
      value = detalle.costo_doc_sin_iva?.toString() || '0'
      originalValue = detalle.costo_doc_sin_iva
    } else if (fieldType === 'total') {
      value = detalle.total?.toString() || '0'
      originalValue = detalle.total
    } else {
      // comentario
      value = detalle.comentario || ''
      originalValue = detalle.comentario
    }
    
    editingCell.value = {
      detalleId: detalle.pedido_detalle_id,
      value: value,
      originalValue: originalValue,
      fieldType: fieldType
    }
    
    // Esperar a que el input se monte en el DOM y darle focus
    nextTick(() => {
      const input = document.querySelector(
        `input[data-editing-cell="${detalle.pedido_detalle_id}"], textarea[data-editing-cell="${detalle.pedido_detalle_id}"]`
      ) as HTMLInputElement | HTMLTextAreaElement
      
      if (input) {
        editingInputElement = input as HTMLInputElement
        input.focus()
        if (input instanceof HTMLInputElement) {
          input.select()
        }
      }
    })
  }

  /**
   * Guarda la edición de una celda
   */
  async function guardarEdicion(onSaveStorage?: () => void) {
    if (!editingCell.value || !pedido.value) return
    
    const fieldType = editingCell.value.fieldType
    const newValueStr = String(editingCell.value.value || '').trim()
    
    // Variable para almacenar el valor numérico calculado (si aplica)
    let newValue: number | null = null
    
    // ⭐ VALIDACIÓN MEJORADA: Validación específica según el tipo de campo
    if (fieldType === 'comentario') {
      // Validar longitud máxima del comentario
      if (newValueStr.length > 2000) {
        toast.warning('Comentario demasiado largo', `El comentario no puede exceder 2000 caracteres. Longitud actual: ${newValueStr.length}`)
        return
      }
      
      if (newValueStr === (editingCell.value.originalValue || '')) {
        editingCell.value = null
        return
      }
    } else {
      // Costo y total aceptan decimales (p. ej. 0.5); el backend persiste float
      const isTotal = fieldType === 'total'
      
      // Si el campo está vacío, tratar como 0 (permitir 0 explícitamente)
      if (newValueStr === '' || newValueStr.trim() === '') {
        newValue = 0
      } else {
        newValue = parseFloat(newValueStr)
      }
      
      // Validar que sea un número válido (incluyendo 0)
      if (isNaN(newValue)) {
        toast.warning('Valor inválido', 'Por favor ingresa un número válido (puede ser 0). Se permiten decimales.')
        return
      }
      
      // Validar que no sea negativo (0 está permitido explícitamente)
      if (newValue < 0) {
        toast.warning('Valor inválido', 'Por favor ingresa un número mayor o igual a 0.')
        return
      }
      
      // Total: solo múltiplos de 0.5 (0, 0.5, 1, 1.5, 2…). Costo: 4 decimales.
      if (isTotal) {
        newValue = Math.round(newValue * 2) / 2
      } else {
        newValue = Math.round(newValue * 1e4) / 1e4
      }
      
      // Validar rangos razonables
      if (fieldType === 'costo' && newValue > 1000000) {
        toast.warning('Costo excede límite', 'El costo unitario no puede exceder 1,000,000. Por favor, verifique el valor.')
        return
      }
      
      if (fieldType === 'total' && newValue > 10000000) {
        toast.warning('Total excede límite', 'El total no puede exceder 10,000,000 unidades. Por favor, verifique el valor.')
        return
      }
      
      if (newValue === editingCell.value.originalValue) {
        editingCell.value = null
        return
      }
    }
    
    // Encontrar el detalle a actualizar
    const detalle = pedido.value.detalles.find(d => d.pedido_detalle_id === editingCell.value!.detalleId)
    if (!detalle) return
    
    const detalleId = editingCell.value.detalleId
    
    // Guardar valores anteriores para poder revertir
    const oldCosto = detalle.costo_doc_sin_iva
    const oldSubtotal = detalle.subtotal
    const oldTotal = detalle.total
    const oldComentario = detalle.comentario
    
    // ACTUALIZACIÓN OPTIMISTA: Actualizar UI inmediatamente usando el valor ya validado
    if (fieldType === 'costo') {
      detalle.costo_doc_sin_iva = newValue!
    } else if (fieldType === 'total') {
      detalle.total = newValue! // Usar el valor ya validado (puede ser 0)
    } else if (fieldType === 'comentario') {
      detalle.comentario = newValueStr || null
    }
    
    // Cerrar el editor inmediatamente
    editingCell.value = null
    
    // Mostrar feedback inmediato
    if (fieldType === 'comentario') {
      toast.info('Actualizando...', 'Guardando comentario...')
    } else {
      const fieldLabel = fieldType === 'costo' ? 'costo' : 'total'
      // Usar el valor ya validado (puede ser 0)
      toast.info('Actualizando...', `Actualizando ${fieldLabel} a ${fieldType === 'costo' ? formatCurrency(newValue!) : formatNumber(newValue!)}`)
    }
    
    try {
      let response
      if (fieldType === 'costo') {
        // Usar el valor ya validado
        response = await mba3ConsultasService.actualizarCostoPedido(
          numeroPedido.value,
          detalleId,
          newValue!
        )
        
        if (response.costo_nuevo !== undefined) {
          detalle.costo_doc_sin_iva = response.costo_nuevo
        }
        if (response.totales) {
          pedido.value.totales = response.totales
        }
        
        marcarColumnaModificada(detalleId, 'costo_doc_sin_iva')
        
        // Guardar modificación en el backend
        await guardarModificacionEnBackend(detalleId, 'costo_doc_sin_iva')
        
        if (onSaveStorage) onSaveStorage()
        
        toast.success('Costo actualizado', `Costo unitario actualizado a ${formatCurrency(newValue!)}`)
      } else if (fieldType === 'total') {
        // Usar el valor ya validado (puede ser 0)
        response = await mba3ConsultasService.actualizarTotalPedido(
          numeroPedido.value,
          detalleId,
          newValue!
        )
        
        if (response.total_nuevo !== undefined) {
          detalle.total = response.total_nuevo
        }
        if (response.totales) {
          pedido.value.totales = response.totales
        }
        
        marcarColumnaModificada(detalleId, 'total')
        
        // Guardar modificación en el backend
        await guardarModificacionEnBackend(detalleId, 'total')
        
        if (onSaveStorage) onSaveStorage()
        
        toast.success('Total actualizado', `Total actualizado a ${formatNumber(newValue!)}`)
      } else if (fieldType === 'comentario') {
        response = await mba3ConsultasService.actualizarComentarioPedido(
          numeroPedido.value,
          detalleId,
          newValueStr || null
        )
        
        if (response.comentario_nuevo !== undefined) {
          detalle.comentario = response.comentario_nuevo
        } else {
          detalle.comentario = newValueStr || null
        }
        
        marcarColumnaModificada(detalleId, 'comentario')
        
        // Guardar modificación en el backend
        await guardarModificacionEnBackend(detalleId, 'comentario')
        
        if (onSaveStorage) onSaveStorage()
        
        toast.success('Comentario guardado', 'El comentario se ha guardado correctamente')
      }
    } catch (e: any) {
      // REVERTIR CAMBIOS si el backend falla
      detalle.costo_doc_sin_iva = oldCosto
      detalle.subtotal = oldSubtotal
      detalle.total = oldTotal
      detalle.comentario = oldComentario
      
      const fieldLabel = fieldType === 'costo' ? 'costo' : fieldType === 'total' ? 'total' : 'comentario'
      const errorMessage = e.message || `No se pudo actualizar el ${fieldLabel}`
      const isBackendError = errorMessage.includes('JSON serializable') || 
                            errorMessage.includes('internal_error') ||
                            errorMessage.includes('500')
      
      if (isBackendError) {
        toast.error(
          'Error del servidor', 
          'El cambio se aplicó localmente pero no se pudo guardar en el servidor. Por favor, recarga la página.'
        )
      } else {
        toast.error('Error al actualizar', errorMessage)
      }
      
      // Restaurar el editor para que el usuario pueda intentar de nuevo
      const detalleActualizado = pedido.value.detalles.find(d => d.pedido_detalle_id === detalleId)
      if (detalleActualizado) {
        let originalValue: number | string | null
        if (fieldType === 'costo') {
          originalValue = oldCosto
        } else if (fieldType === 'total') {
          originalValue = oldTotal
        } else {
          originalValue = oldComentario ?? null
        }
        
        editingCell.value = {
          detalleId: detalleActualizado.pedido_detalle_id,
          value: originalValue?.toString() || (fieldType === 'comentario' ? '' : '0'),
          originalValue: originalValue,
          fieldType: fieldType
        }
      }
    }
  }

  /**
   * Cancela la edición de una celda
   */
  function cancelarEdicion() {
    editingCell.value = null
  }

  /** Columna correspondiente a cada fieldType (inverso de FIELD_TYPE_POR_COLUMNA). */
  const COLUMNA_POR_FIELD_TYPE: Record<EditingCell['fieldType'], string> = {
    costo: 'costo_doc_sin_iva',
    total: 'total',
    comentario: 'comentario'
  }

  /**
   * Al presionar Tab editando TOTAL o COMENTARIO: guarda la celda actual y abre la edición
   * de la siguiente fila en la misma columna. En la última fila, salta a la primera fila de
   * la siguiente columna editable (según el orden visual actual de columnas).
   */
  function avanzarConTab(fieldType: 'total' | 'comentario') {
    if (!editingCell.value || !pedido.value) return

    const detalles = pedido.value.detalles
    const currentIndex = detalles.findIndex(d => d.pedido_detalle_id === editingCell.value!.detalleId)

    avanzandoConTab = true
    guardarEdicion()

    if (currentIndex === -1) {
      avanzandoConTab = false
      return
    }

    const siguienteDetalle = detalles[currentIndex + 1]
    if (siguienteDetalle) {
      iniciarEdicion(siguienteDetalle, fieldType)
      nextTick(() => { avanzandoConTab = false })
      return
    }

    // Última fila: saltar a la siguiente columna editable
    const ordenColumnas = (getOrderedColumnKeys ? getOrderedColumnKeys() : Object.keys(FIELD_TYPE_POR_COLUMNA))
      .filter(key => key in FIELD_TYPE_POR_COLUMNA)
    const idxActual = ordenColumnas.indexOf(COLUMNA_POR_FIELD_TYPE[fieldType])
    if (idxActual === -1 || ordenColumnas.length < 2) {
      avanzandoConTab = false
      return
    }

    const siguienteColumna = ordenColumnas[(idxActual + 1) % ordenColumnas.length]
    const primerDetalle = detalles[0]
    if (primerDetalle) {
      iniciarEdicion(primerDetalle, FIELD_TYPE_POR_COLUMNA[siguienteColumna])
    }
    nextTick(() => { avanzandoConTab = false })
  }

  /**
   * Wrapper de guardarEdicion para el evento @blur de los inputs de edición.
   * Ignora el blur espurio que dispara el navegador al desmontar el input viejo
   * durante una navegación con Tab (ver avanzandoConTab).
   */
  function manejarBlurEdicion() {
    if (avanzandoConTab) return
    guardarEdicion()
  }

  /**
   * Maneja las teclas durante la edición (Enter para guardar, Escape para cancelar).
   * Para TOTAL: solo permite dígitos (no punto ni coma); valores con decimales se hacen con las flechas del input.
   * Tab en TOTAL/COMENTARIO navega verticalmente dentro de la columna (ver avanzarConTab).
   */
  function manejarTeclasEdicion(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      guardarEdicion()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelarEdicion()
    } else if (event.key === 'Tab' && (editingCell.value?.fieldType === 'total' || editingCell.value?.fieldType === 'comentario')) {
      event.preventDefault()
      avanzarConTab(editingCell.value.fieldType)
    } else if (editingCell.value?.fieldType === 'total') {
      // Solo permitir dígitos 0-9 y teclas de control (no punto, coma, e, -, +)
      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
      if (allowedKeys.includes(event.key)) return
      if (/^[0-9]$/.test(event.key)) return
      event.preventDefault()
    }
  }

  return {
    editingCell,
    iniciarEdicion,
    guardarEdicion,
    cancelarEdicion,
    manejarTeclasEdicion,
    manejarBlurEdicion,
    isColumnaModificada,
    getColumnaModificadaKey,
    getRolModificador
  }
}
