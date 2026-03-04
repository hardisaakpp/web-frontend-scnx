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

export function useColumnManagement(
  pedido: Ref<PedidoCompleto | null>,
  numeroPedido: Ref<string>,
  columnasModificadas?: Ref<Set<string>>
) {
  const toast = useToast()
  const editingCell = ref<EditingCell | null>(null)
  let editingInputElement: HTMLInputElement | null = null

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
   * Marca una columna como modificada
   */
  function marcarColumnaModificada(detalleId: string, columnKey: string) {
    if (columnasModificadas) {
      columnasModificadas.value.add(getColumnaModificadaKey(detalleId, columnKey))
    }
  }

  /**
   * Guarda una modificación en el backend.
   * El backend espera numero_pedido en la URL, no pedido_id (UUID).
   */
  async function guardarModificacionEnBackend(detalleId: string, columnKey: string) {
    const numeroParaApi = pedido.value?.cabecera?.numero_pedido ?? numeroPedido.value
    if (!numeroParaApi) return
    
    try {
      // Obtener todas las modificaciones actuales
      const modificacionesActuales: Array<{ pedido_detalle_id: string; columna_key: string }> = []
      
      if (columnasModificadas) {
        columnasModificadas.value.forEach(key => {
          const [detId, colKey] = key.split(':')
          modificacionesActuales.push({
            pedido_detalle_id: detId,
            columna_key: colKey
          })
        })
      }
      
      // Guardar todas las modificaciones en el backend (usar numero_pedido, no UUID)
      await mba3ConsultasService.guardarModificacionesColumnas(
        numeroParaApi,
        modificacionesActuales
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

  /**
   * Maneja las teclas durante la edición (Enter para guardar, Escape para cancelar).
   * Para TOTAL: solo permite dígitos (no punto ni coma); valores con decimales se hacen con las flechas del input.
   */
  function manejarTeclasEdicion(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      guardarEdicion()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelarEdicion()
    } else if (editingCell.value?.fieldType === 'total') {
      // Solo permitir dígitos 0-9 y teclas de control (no punto, coma, e, -, +)
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
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
    isColumnaModificada,
    getColumnaModificadaKey
  }
}
