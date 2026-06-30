import { defineStore } from 'pinia'
import { ref } from '@vue/reactivity'
import { transaccionesService } from '../services/transaccionesApi'
import type {
  Transaccion,
  TransaccionTesoreria,
  ReservarTransaccionRequest,
  FiltrosCajero,
  FiltrosTesoreria,
} from '../types'

export const useTransaccionesStore = defineStore('transacciones', () => {
  // ─── Estado cajero ─────────────────────────────────────────────────────────

  const loadingCajero = ref(false)
  const errorCajero = ref<string | null>(null)
  const transaccionesCajero = ref<Transaccion[]>([])

  // ─── Estado tesorería ──────────────────────────────────────────────────────

  const loadingTesoreria = ref(false)
  const errorTesoreria = ref<string | null>(null)
  const transaccionesTesoreria = ref<TransaccionTesoreria[]>([])
  const loadingExcel = ref(false)

  // ─── Estado reserva ────────────────────────────────────────────────────────

  const reservando = ref(false)

  // ─── Acciones cajero ───────────────────────────────────────────────────────

  async function fetchCajero(filtros: FiltrosCajero) {
    loadingCajero.value = true
    errorCajero.value = null
    try {
      const response = await transaccionesService.cajero.obtener(filtros)
      transaccionesCajero.value = response.data
      return response.data
    } catch (err: any) {
      errorCajero.value = err.responseData?.error || err.message || 'Error al cargar transacciones'
      throw err
    } finally {
      loadingCajero.value = false
    }
  }

  async function reservar(id: number, payload: ReservarTransaccionRequest) {
    reservando.value = true
    try {
      await transaccionesService.cajero.reservar(id, payload)
      const tx = transaccionesCajero.value.find(t => t.id === id)
      if (tx) {
        tx.estado = 'RESERVADO'
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
      transaccionesTesoreria.value = response.data
      return response.data
    } catch (err: any) {
      errorTesoreria.value = err.responseData?.error || err.message || 'Error al cargar reporte'
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

      const url = URL.createObjectURL(response.data)
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
    loadingCajero, errorCajero, transaccionesCajero, reservando, fetchCajero, reservar,
    loadingTesoreria, errorTesoreria, transaccionesTesoreria, loadingExcel, fetchTesoreria, descargarExcel,
  }
})
