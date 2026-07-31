import { defineStore } from 'pinia'
import { ref } from '@vue/reactivity'
import { transaccionesService } from '../services/transaccionesApi'
import type {
  Almacen,
  CuentaTesoreria,
  Transaccion,
  TransaccionTesoreria,
  ReservarTransaccionRequest,
  FiltrosCajero,
  FiltrosTesoreria,
} from '../types'

export const useTransaccionesStore = defineStore('transacciones', () => {
  // ─── Estado almacenes ──────────────────────────────────────────────────────

  const almacenes = ref<Almacen[]>([])
  const loadingAlmacenes = ref(false)

  async function fetchAlmacenes() {
    if (almacenes.value.length > 0) return
    loadingAlmacenes.value = true
    try {
      const response = await transaccionesService.almacenes.obtener()
      almacenes.value = response.data as Almacen[]
    } catch {
      // endpoint aún no disponible — el select quedará vacío sin romper la vista
    } finally {
      loadingAlmacenes.value = false
    }
  }

  // ─── Estado cuentas (tesorería) ───────────────────────────────────────────

  const cuentas = ref<CuentaTesoreria[]>([])
  const loadingCuentas = ref(false)

  async function fetchCuentas() {
    if (cuentas.value.length > 0) return
    loadingCuentas.value = true
    try {
      const response = await transaccionesService.cuentas.obtener()
      cuentas.value = response.data as CuentaTesoreria[]
    } catch {
      // silenciar — el select quedará vacío sin romper la vista
    } finally {
      loadingCuentas.value = false
    }
  }

  async function fetchCuentasCajero() {
    if (cuentas.value.length > 0) return
    loadingCuentas.value = true
    try {
      const response = await transaccionesService.cuentasCajero.obtener()
      cuentas.value = response.data as CuentaTesoreria[]
    } catch {
      // silenciar — el select quedará vacío sin romper la vista
    } finally {
      loadingCuentas.value = false
    }
  }

  // ─── Estado cajero ─────────────────────────────────────────────────────────

  const loadingCajero = ref(false)
  const errorCajero = ref<string | null>(null)
  const transaccionesCajero = ref<Transaccion[]>([])

  // ─── Estado tesorería ──────────────────────────────────────────────────────

  const loadingTesoreria = ref(false)
  const errorTesoreria = ref<string | null>(null)
  const transaccionesTesoreria = ref<TransaccionTesoreria[]>([])
  const loadingExcel = ref(false)

  // ─── Estado historial reserva ──────────────────────────────────────────────

  const loadingHistorial = ref(false)
  const errorHistorial = ref<string | null>(null)
  const transaccionesHistorial = ref<TransaccionTesoreria[]>([])

  async function fetchHistorial(filtros: FiltrosTesoreria) {
    loadingHistorial.value = true
    errorHistorial.value = null
    try {
      const response = await transaccionesService.historialReserva.obtener(filtros)
      transaccionesHistorial.value = response.data as TransaccionTesoreria[]
      return response.data as TransaccionTesoreria[]
    } catch (err: any) {
      errorHistorial.value = err.response?.data?.error || err.message || 'Error al cargar historial'
      throw err
    } finally {
      loadingHistorial.value = false
    }
  }

  // ─── Estado reserva ────────────────────────────────────────────────────────

  const reservando = ref(false)

  // ─── Acciones cajero ───────────────────────────────────────────────────────

  async function fetchCajero(filtros: FiltrosCajero) {
    loadingCajero.value = true
    errorCajero.value = null
    try {
      const response = await transaccionesService.cajero.obtener(filtros)
      transaccionesCajero.value = response.data as Transaccion[]
      return response.data as Transaccion[]
    } catch (err: any) {
      const status = err.response?.status
      if (status === 403) {
        errorCajero.value = err.response?.data?.error || err.response?.data?.title || 'Sin autorización: el usuario no tiene acceso a este recurso'
      } else {
        errorCajero.value = err.response?.data?.error || err.message || 'Error al cargar transacciones'
      }
      throw err
    } finally {
      loadingCajero.value = false
    }
  }

  function limpiarCajero() {
    transaccionesCajero.value = []
    errorCajero.value = null
  }

  async function reservar(id: number, payload: ReservarTransaccionRequest) {
    reservando.value = true
    try {
      await transaccionesService.cajero.reservar(id, payload)
      const tx = transaccionesCajero.value.find(t => t.id === id)
      if (tx) {
        tx.estado = 'Reservado'
        tx.codigoAlmacen = payload.codigoAlmacen
      }
    } finally {
      reservando.value = false
    }
  }

  // ─── Acciones tesorería ────────────────────────────────────────────────────

  async function fetchTesoreria(filtros: FiltrosTesoreria) {
    loadingTesoreria.value = true
    errorTesoreria.value = null
    try {
      const response = await transaccionesService.tesoreria.obtener(filtros)
      transaccionesTesoreria.value = response.data as TransaccionTesoreria[]
      return response.data as TransaccionTesoreria[]
    } catch (err: any) {
      errorTesoreria.value = err.response?.data?.error || err.message || 'Error al cargar reporte'
      throw err
    } finally {
      loadingTesoreria.value = false
    }
  }

  async function descargarExcel(filtros: FiltrosTesoreria, fallbackFileName?: string) {
    loadingExcel.value = true
    try {
      const response = await transaccionesService.tesoreria.exportarExcel(filtros)
      const disposition = response.headers['content-disposition'] || ''
      const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)["']?/)
      const fileName = match?.[1]?.trim() || fallbackFileName || `transacciones_${filtros.idCuenta}.xlsx`

      const url = URL.createObjectURL(response.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      loadingExcel.value = false
    }
  }

  return {
    almacenes, loadingAlmacenes, fetchAlmacenes,
    cuentas, loadingCuentas, fetchCuentas, fetchCuentasCajero,
    loadingCajero, errorCajero, transaccionesCajero, reservando, fetchCajero, reservar, limpiarCajero,
    loadingHistorial, errorHistorial, transaccionesHistorial, fetchHistorial,
    loadingTesoreria, errorTesoreria, transaccionesTesoreria, loadingExcel, fetchTesoreria, descargarExcel,
  }
})
