import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import sotApi from '../services/sotApi'
import type { SolicitudTransferenciaDto, SolicitudTransferenciaFilterDto, SyncSotResult } from '../types'

/**
 * Solicitudes de Transferencia (SOT) — equivalente de odcStore.ts pero para el circuito de
 * Distribución/Crossdocking (P-008). Agrega selección múltiple (checkboxes) porque acá el
 * listado existe para elegir varias y armar un Grupo, no solo para navegar al detalle.
 */
export const useSotStore = defineStore('cediSot', () => {
  const items = ref<SolicitudTransferenciaDto[]>([])
  const totalCount = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const filters = ref<SolicitudTransferenciaFilterDto>({ soloDisponibles: true })
  const loading = ref(false)
  const error = ref<string | null>(null)

  const syncing = ref(false)
  const lastSync = ref<SyncSotResult | null>(null)

  const seleccionadas = ref<Set<string>>(new Set())

  const solicitudesSeleccionadas = computed(() =>
    items.value.filter(s => seleccionadas.value.has(s.id)))

  async function fetchSolicitudes() {
    loading.value = true
    error.value = null
    try {
      const result = await sotApi.getSolicitudes(filters.value, page.value, pageSize.value)
      items.value = result.data
      totalCount.value = result.totalCount
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Error al cargar solicitudes de transferencia'
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters: Partial<SolicitudTransferenciaFilterDto>) {
    filters.value = { ...filters.value, ...newFilters }
    page.value = 1
    fetchSolicitudes()
  }

  function setPage(newPage: number) {
    page.value = newPage
    fetchSolicitudes()
  }

  function toggleSeleccion(id: string) {
    const next = new Set(seleccionadas.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    seleccionadas.value = next
  }

  function limpiarSeleccion() {
    seleccionadas.value = new Set()
  }

  async function sync(maxPages = 5) {
    syncing.value = true
    error.value = null
    try {
      lastSync.value = await sotApi.syncSolicitudes(maxPages)
      await fetchSolicitudes()
      return lastSync.value
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Error al sincronizar con SAP'
      throw e
    } finally {
      syncing.value = false
    }
  }

  return {
    items, totalCount, page, pageSize, filters, loading, error,
    syncing, lastSync,
    seleccionadas, solicitudesSeleccionadas,
    fetchSolicitudes, setFilters, setPage, toggleSeleccion, limpiarSeleccion, sync,
  }
})
