import { defineStore } from 'pinia'
import { ref, computed } from '@vue/reactivity'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { AjusteDetalle, IntegracionSAPDetalle, SolicitudesTransferencia } from '../types'
import { isProcesoTransientError, rethrowIfTransient } from '../utils/procesoAsyncHelpers'
import { SAP_MAY_STILL_PROCESSING_MESSAGE } from '../utils/httpErrors'

// Estado del proceso de generación de ODC
type ODCProcessState = 
  | 'idle'           // Sin proceso activo
  | 'generating'     // Generando ODC en backend
  | 'syncing'        // Sincronizando datos (solo si backend no confirma)
  | 'ready'          // Proceso completo, datos listos
  | 'error'          // Error en algún paso

// Tipo para el resultado del envío a SAP desde redistribución
interface SAPResultadoPendiente {
  detalle: IntegracionSAPDetalle | null
  solicitudesTransferencia: SolicitudesTransferencia | null
  /**
   * ODC adicionales del mismo pedido (pedido mixto: tiendas de más de una marca en el
   * mismo Excel generan 2 ODC, una por bodega, ambas enviadas a SAP). La primera ODC va
   * en `detalle`/`solicitudesTransferencia`; el resto va aquí para que el modal en
   * /proceso las muestre todas en vez de solo la primera.
   */
  detallesAdicionales?: { detalle: IntegracionSAPDetalle; solicitudesTransferencia: SolicitudesTransferencia | null }[]
  estadoGeneral: 'success' | 'partial' | 'error'
  numeroPedido: string
  /** Último body de ajustes usado en proceso-completo-sap; permite reintentar el mismo POST desde Proceso completo. */
  ajustesDetalle?: AjusteDetalle[]
}

export const useProcesoStore = defineStore('mba3Proceso', () => {
  // Estados básicos (mantener compatibilidad con código existente)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentStep = ref<string | null>(null)
  const resultados = ref<any>(null)
  const progress = ref(0)
  
  // ⭐ NUEVO: Resultado pendiente de envío SAP para mostrar en modal
  const sapResultadoPendiente = ref<SAPResultadoPendiente | null>(null)

  // ========== Estado del proceso ODC ==========
  const odcProcessState = ref<ODCProcessState>('idle')
  const odcProcessError = ref<string | null>(null)
  const odcProcessDespachos = ref<string[]>([])
  const odcProcessId = ref<string | null>(null)  // Para trazabilidad y debugging

  // Computed: ¿Está bloqueando la UI?
  const isBlocking = computed(() => {
    return odcProcessState.value === 'generating' || odcProcessState.value === 'syncing'
  })

  // Computed: ¿Puede el usuario interactuar? (útil para deshabilitar botones)
  const canInteract = computed(() => {
    return odcProcessState.value === 'idle' || odcProcessState.value === 'ready'
  })

  // Función para resetear el estado del proceso ODC
  function resetODCProcess() {
    odcProcessState.value = 'idle'
    odcProcessError.value = null
    odcProcessDespachos.value = []
    odcProcessId.value = null
  }

  // Función para iniciar el proceso de generación de ODC
  function startODCProcess(despachoIds: string | string[]) {
    odcProcessState.value = 'generating'
    odcProcessError.value = null
    odcProcessDespachos.value = Array.isArray(despachoIds) ? despachoIds : [despachoIds]
    odcProcessId.value = null // Se asignará cuando llegue la respuesta del backend
  }

  // Función para pasar a sincronización (solo si backend no confirma)
  function setODCProcessSyncing() {
    if (odcProcessState.value === 'generating') {
      odcProcessState.value = 'syncing'
    }
  }

  // Función para completar el proceso
  // NOTA: El auto-reset se maneja en el componente para mantener el store determinista
  function completeODCProcess() {
    odcProcessState.value = 'ready'
  }

  // Función para marcar error
  function setODCProcessError(errorMessage: string) {
    odcProcessState.value = 'error'
    odcProcessError.value = errorMessage
  }

  // Función para guardar el process_id del backend
  function setODCProcessId(processId: string) {
    odcProcessId.value = processId
    // Log para debugging en producción
    if (import.meta.env.DEV) console.log(`[ODC Process] process_id asignado: ${processId}`)
  }

  async function migrar() {
    loading.value = true
    error.value = null
    currentStep.value = 'migrar'
    progress.value = 50
    try {
      const data = await mba3ConsultasService.migrar()
      resultados.value = { ...resultados.value, migrar: data }
      return data
    } catch (err: unknown) {
      if (isProcesoTransientError(err)) {
        error.value = SAP_MAY_STILL_PROCESSING_MESSAGE
        rethrowIfTransient(err)
      }
      const message = err instanceof Error ? err.message : 'Error al migrar'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function procesarOC(despachoIds?: string | string[]) {
    loading.value = true
    error.value = null
    currentStep.value = 'procesar-oc'
    progress.value = 75
    
    try {
      const data = await mba3ConsultasService.procesarOC(despachoIds)
      resultados.value = { ...resultados.value, procesarOC: data }
      
      // Guardar process_id si viene en la respuesta (para trazabilidad)
      if (data?.process_id) {
        setODCProcessId(data.process_id)
      }
      
      // Log para debugging en producción
      const ocStatus = data?.metadata?.oc_status
      if (ocStatus) {
        if (import.meta.env.DEV) console.log(`[ODC Process] Estado recibido: ${ocStatus.status}`, {
          process_id: data.process_id,
          oc_creadas: ocStatus.oc_creadas,
          oc_errores: ocStatus.oc_errores,
          despachos_actualizados: ocStatus.despachos_actualizados,
          datos_sincronizados: ocStatus.datos_sincronizados
        })
      }
      
      // Actualizar progreso según confirmación del backend
      if (ocStatus?.datos_sincronizados === true && ocStatus?.despachos_actualizados === true) {
        // Backend confirma que todo está listo
        progress.value = 100
      } else {
        // Backend no confirma, necesitaremos sincronizar
        progress.value = 90
      }
      
      return data
    } catch (err: unknown) {
      if (isProcesoTransientError(err)) {
        error.value = SAP_MAY_STILL_PROCESSING_MESSAGE
        rethrowIfTransient(err)
      }
      const message = err instanceof Error ? err.message : 'Error al procesar ODC'
      error.value = message
      console.error('[ODC Process] Error al procesar:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function integrarSAP(referenciaDespacho?: string | string[]) {
    loading.value = true
    error.value = null
    currentStep.value = 'integrar-sap'
    progress.value = 100
    try {
      const data = await mba3ConsultasService.integrarSAP(referenciaDespacho)
      resultados.value = { ...resultados.value, integrarSAP: data }
      return data
    } catch (err: unknown) {
      if (isProcesoTransientError(err)) {
        error.value = SAP_MAY_STILL_PROCESSING_MESSAGE
        rethrowIfTransient(err)
      }
      const message = err instanceof Error ? err.message : 'Error al integrar con SAP'
      error.value = message
      throw err
    } finally {
      loading.value = false
      currentStep.value = null
    }
  }

  /**
   * Procesa ODC desde un pedido (similar a procesarOC pero para pedidos)
   * Reutiliza la misma lógica de transformación docenas→unidades SAP
   */
  async function procesarOCDesdePedido(numeroPedido: string) {
    loading.value = true
    error.value = null
    currentStep.value = 'procesar-oc'
    progress.value = 75
    
    try {
      const data = await mba3ConsultasService.procesarOCDesdePedido(numeroPedido)
      resultados.value = { ...resultados.value, procesarOCDesdePedido: data }
      
      // Guardar process_id si viene en la respuesta
      if (data?.process_id) {
        setODCProcessId(data.process_id)
      }
      
      // Log para debugging
      const ocStatus = data?.metadata?.oc_status
      if (ocStatus) {
        if (import.meta.env.DEV) console.log(`[ODC Process Pedido] Estado recibido: ${ocStatus.status}`, {
          process_id: data.process_id,
          oc_creadas: ocStatus.oc_creadas,
          oc_errores: ocStatus.oc_errores
        })
      }
      
      // Actualizar progreso
      if (ocStatus?.datos_sincronizados === true) {
        progress.value = 100
      } else {
        progress.value = 90
      }
      
      return data
    } catch (err: unknown) {
      if (isProcesoTransientError(err)) {
        error.value = SAP_MAY_STILL_PROCESSING_MESSAGE
        rethrowIfTransient(err)
      }
      const message = err instanceof Error ? err.message : 'Error al procesar ODC desde pedido'
      error.value = message
      console.error('[ODC Process Pedido] Error al procesar:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function procesoCompleto() {
    loading.value = true
    error.value = null
    progress.value = 0
    currentStep.value = 'migrar'
    
    // Simular progreso paso a paso
    const progressSteps = [
      { step: 'migrar', progress: 33 },
      { step: 'procesar-oc', progress: 66 }
    ]
    
    let currentStepIndex = 0
    
    // Actualizar progreso cada segundo
    const progressInterval = setInterval(() => {
      if (currentStepIndex < progressSteps.length) {
        const stepInfo = progressSteps[currentStepIndex]
        currentStep.value = stepInfo.step
        progress.value = stepInfo.progress
        currentStepIndex++
      }
    }, 2000) // Cambiar de paso cada 2 segundos
    
    try {
      const data = await mba3ConsultasService.pruebas()
      clearInterval(progressInterval)
      resultados.value = data
      currentStep.value = 'procesar-oc'
      progress.value = 100
      
      // Pequeño delay para mostrar el último paso completado
      setTimeout(() => {
        currentStep.value = null
      }, 500)
      
      return data
    } catch (err: any) {
      clearInterval(progressInterval)
      error.value = err.message || 'Error en proceso completo'
      currentStep.value = null
      throw err
    } finally {
      loading.value = false
    }
  }

  function reset() {
    resultados.value = null
    error.value = null
    currentStep.value = null
    progress.value = 0
    resetODCProcess()
  }

  // ⭐ NUEVO: Funciones para manejar resultado pendiente de SAP
  function setSAPResultadoPendiente(resultado: SAPResultadoPendiente) {
    sapResultadoPendiente.value = resultado
  }

  function clearSAPResultadoPendiente() {
    sapResultadoPendiente.value = null
  }

  // Computed: ¿Hay resultado pendiente de mostrar?
  const hasSAPResultadoPendiente = computed(() => sapResultadoPendiente.value !== null)

  return {
    // Estados básicos (compatibilidad)
    loading,
    error,
    currentStep,
    resultados,
    progress,
    
    // Nuevos estados del proceso ODC
    odcProcessState,
    odcProcessError,
    odcProcessDespachos,
    odcProcessId,
    isBlocking,
    canInteract,
    
    // Funciones
    migrar,
    procesarOC,
    integrarSAP,
    procesoCompleto,
    reset,
    procesarOCDesdePedido,
    
    // Nuevas funciones del proceso ODC
    resetODCProcess,
    startODCProcess,
    setODCProcessSyncing,
    completeODCProcess,
    setODCProcessError,
    setODCProcessId,
    
    // ⭐ NUEVO: Resultado pendiente de SAP (para mostrar modal en /proceso)
    sapResultadoPendiente,
    hasSAPResultadoPendiente,
    setSAPResultadoPendiente,
    clearSAPResultadoPendiente,
  }
})

