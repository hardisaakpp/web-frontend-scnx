import { ref } from 'vue'
import { defineStore } from 'pinia'
import { pickingApi } from '../services/pickingApi'
import { mapApiError } from '@/utils/apiErrorMapper'
import type { OrdenPickingLogResponse, OrdenPickingScanResponse, OrdenPickingSesionResponse } from '../types'

/**
 * Sesion de picking activa: iniciar/cargar, escanear, eliminar el propio scan, cerrar.
 * Guard de respuestas obsoletas (activeSesionId) igual criterio que
 * recepcion-mercaderia/stores/pickingStore.ts: si el usuario navega a otra sesion mientras una
 * peticion sigue en vuelo, esa respuesta tardia se descarta en vez de pisar el estado actual.
 */
export const usePickingStore = defineStore('recepcionProveedoresPicking', () => {
  const sesion = ref<OrdenPickingSesionResponse | null>(null)
  const scans = ref<OrdenPickingScanResponse[]>([])
  const logs = ref<OrdenPickingLogResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const actionError = ref<string | null>(null)
  const isSubmitting = ref(false)

  const activeSesionId = ref<number | null>(null)

  async function cargarSesionActiva(docNum: number): Promise<OrdenPickingSesionResponse | null> {
    loading.value = true
    error.value = null
    try {
      return await pickingApi.obtenerSesionActiva(docNum)
    } catch (err: unknown) {
      error.value = mapApiError(err, 'No se pudo consultar la sesión activa de picking.').message
      return null
    } finally {
      loading.value = false
    }
  }

  async function iniciar(docNum: number, whsCode: string): Promise<OrdenPickingSesionResponse | null> {
    loading.value = true
    error.value = null
    try {
      const resultado = await pickingApi.iniciar(docNum, whsCode)
      activeSesionId.value = resultado.id
      sesion.value = resultado
      return resultado
    } catch (err: unknown) {
      error.value = mapApiError(err, 'No se pudo iniciar el picking.').message
      return null
    } finally {
      loading.value = false
    }
  }

  async function cargarSesion(sesionId: number): Promise<void> {
    activeSesionId.value = sesionId
    sesion.value = null
    scans.value = []
    logs.value = []
    error.value = null
    loading.value = true
    try {
      const resultado = await pickingApi.obtenerSesion(sesionId)
      if (activeSesionId.value !== sesionId) return
      sesion.value = resultado
    } catch (err: unknown) {
      if (activeSesionId.value !== sesionId) return
      error.value = mapApiError(err, 'No se pudo cargar la sesión de picking.').message
    } finally {
      if (activeSesionId.value === sesionId) loading.value = false
    }
  }

  async function cargarScans(): Promise<void> {
    if (!sesion.value) return
    const sesionId = sesion.value.id
    try {
      const resultado = await pickingApi.obtenerScans(sesionId)
      if (activeSesionId.value !== sesionId) return
      scans.value = resultado
    } catch (err: unknown) {
      if (activeSesionId.value !== sesionId) return
      actionError.value = mapApiError(err, 'No se pudo cargar el historial de escaneos.').message
    }
  }

  async function cargarLogs(): Promise<void> {
    if (!sesion.value) return
    const sesionId = sesion.value.id
    try {
      const resultado = await pickingApi.obtenerLogs(sesionId)
      if (activeSesionId.value !== sesionId) return
      logs.value = resultado
    } catch (err: unknown) {
      if (activeSesionId.value !== sesionId) return
      actionError.value = mapApiError(err, 'No se pudo cargar el registro de eventos.').message
    }
  }

  async function escanear(codigo: string, cantidad: number): Promise<boolean> {
    if (!sesion.value) return false
    const sesionId = sesion.value.id

    actionError.value = null
    isSubmitting.value = true
    try {
      const lineaActualizada = await pickingApi.escanear(sesionId, codigo, cantidad)
      if (activeSesionId.value !== sesionId) return false
      sesion.value = {
        ...sesion.value,
        lineas: sesion.value.lineas.map((l) => (l.id === lineaActualizada.id ? lineaActualizada : l)),
      }
      await cargarScans()
      return true
    } catch (err: unknown) {
      if (activeSesionId.value !== sesionId) return false
      actionError.value = mapApiError(err, 'No se pudo registrar el escaneo.').message
      return false
    } finally {
      if (activeSesionId.value === sesionId) isSubmitting.value = false
    }
  }

  /** Solo el dueño del scan puede eliminarlo — el backend lo garantiza (403 si no), esto asume que la vista ya ocultó el botón para scans ajenos. */
  async function eliminarScan(scanId: number): Promise<void> {
    if (!sesion.value) return
    const sesionId = sesion.value.id

    actionError.value = null
    isSubmitting.value = true
    try {
      await pickingApi.eliminarScan(sesionId, scanId)
      if (activeSesionId.value !== sesionId) return
      const [sesionActualizada] = await Promise.all([pickingApi.obtenerSesion(sesionId), cargarScans()])
      if (activeSesionId.value !== sesionId) return
      sesion.value = sesionActualizada
    } catch (err: unknown) {
      if (activeSesionId.value !== sesionId) return
      actionError.value = mapApiError(err, 'No se pudo eliminar el escaneo.').message
    } finally {
      if (activeSesionId.value === sesionId) isSubmitting.value = false
    }
  }

  /**
   * "Confirmar Picking"/"Confirmar Parcial": un solo clic que cierra la sesion (si todavia esta
   * EnProceso) y crea el Goods Receipt en SAP en la misma peticion. Devuelve true en cualquier
   * round-trip HTTP exitoso — el resultado de negocio (IntegradaSap/EnviandoSap/ErrorSap) vive
   * en sesion.estado/sesion.sapErrorMensaje. ErrorSap llega en un 200 normal, NO es un error
   * HTTP: no debe pasar por actionError/ErrorModal.
   */
  async function confirmarPicking(): Promise<boolean> {
    return ejecutarConfirmacion(pickingApi.confirmarPicking, 'No se pudo confirmar el picking.')
  }

  async function confirmarParcial(): Promise<boolean> {
    return ejecutarConfirmacion(pickingApi.confirmarParcial, 'No se pudo confirmar la recepción parcial.')
  }

  async function ejecutarConfirmacion(
    accion: (sesionId: number) => Promise<OrdenPickingSesionResponse>,
    mensajeError: string,
  ): Promise<boolean> {
    if (!sesion.value) return false
    const sesionId = sesion.value.id

    actionError.value = null
    isSubmitting.value = true
    try {
      const resultado = await accion(sesionId)
      if (activeSesionId.value !== sesionId) return false
      sesion.value = resultado
      return true
    } catch (err: unknown) {
      if (activeSesionId.value !== sesionId) return false
      actionError.value = mapApiError(err, mensajeError).message
      return false
    } finally {
      if (activeSesionId.value === sesionId) isSubmitting.value = false
    }
  }

  async function verificarEstadoSap(): Promise<boolean> {
    if (!sesion.value) return false
    const sesionId = sesion.value.id

    actionError.value = null
    isSubmitting.value = true
    try {
      const resultado = await pickingApi.verificarEstadoSap(sesionId)
      if (activeSesionId.value !== sesionId) return false
      sesion.value = resultado
      return true
    } catch (err: unknown) {
      if (activeSesionId.value !== sesionId) return false
      actionError.value = mapApiError(err, 'No se pudo verificar el estado de la integración a SAP.').message
      return false
    } finally {
      if (activeSesionId.value === sesionId) isSubmitting.value = false
    }
  }

  /**
   * "Eliminar Picking": borra la sesion completa (irreversible), no un scan individual.
   * A diferencia de cerrar()/integrarSap(), al exito no hay sesion que guardar — se limpia.
   */
  async function eliminarSesion(): Promise<boolean> {
    if (!sesion.value) return false
    const sesionId = sesion.value.id

    actionError.value = null
    isSubmitting.value = true
    try {
      await pickingApi.eliminarSesion(sesionId)
      if (activeSesionId.value !== sesionId) return false
      sesion.value = null
      return true
    } catch (err: unknown) {
      if (activeSesionId.value !== sesionId) return false
      actionError.value = mapApiError(err, 'No se pudo eliminar el picking.').message
      return false
    } finally {
      if (activeSesionId.value === sesionId) isSubmitting.value = false
    }
  }

  function limpiarActionError(): void {
    actionError.value = null
  }

  return {
    sesion,
    scans,
    logs,
    loading,
    error,
    actionError,
    isSubmitting,
    cargarSesionActiva,
    iniciar,
    cargarSesion,
    cargarScans,
    cargarLogs,
    escanear,
    eliminarScan,
    confirmarPicking,
    confirmarParcial,
    verificarEstadoSap,
    eliminarSesion,
    limpiarActionError,
  }
})
