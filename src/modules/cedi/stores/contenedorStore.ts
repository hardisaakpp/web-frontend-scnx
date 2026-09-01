import { defineStore } from 'pinia'
import { ref } from 'vue'
import contenedorApi from '../services/contenedorApi'
import type { TrazabilidadSolicitudDto } from '../types'

/** Contenedores Virtuales (P-017) — trazabilidad picking → empaque de UNA solicitud dentro de un grupo. */
export const useContenedorStore = defineStore('cediContenedor', () => {
  const trazabilidad = ref<TrazabilidadSolicitudDto | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const creando = ref(false)
  const empacando = ref(false)
  const cerrando = ref(false)

  /** El operador elige en qué contenedor abierto está empacando ahora — persiste mientras dura la pantalla. */
  const contenedorActivoId = ref<string | null>(null)

  async function cargar(grupoId: string, solicitudId: string) {
    loading.value = true
    error.value = null
    try {
      trazabilidad.value = await contenedorApi.getTrazabilidad(grupoId, solicitudId)
      const abierto = trazabilidad.value.contenedores.find(c => c.estado === 'Abierto')
      if (abierto && !contenedorActivoId.value) contenedorActivoId.value = abierto.id
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo cargar la trazabilidad'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function crearContenedor(grupoId: string, solicitudId: string) {
    creando.value = true
    error.value = null
    try {
      const contenedor = await contenedorApi.crear(grupoId, solicitudId)
      contenedorActivoId.value = contenedor.id
      await cargar(grupoId, solicitudId)
      return contenedor
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo crear el contenedor'
      throw e
    } finally {
      creando.value = false
    }
  }

  async function empacar(grupoId: string, solicitudId: string, itemCode: string, cantidad: number) {
    if (!contenedorActivoId.value) return
    empacando.value = true
    error.value = null
    try {
      await contenedorApi.empacarItem(contenedorActivoId.value, { itemCode, cantidad })
      await cargar(grupoId, solicitudId)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo empacar'
      throw e
    } finally {
      empacando.value = false
    }
  }

  async function cerrarContenedor(grupoId: string, solicitudId: string, contenedorId: string) {
    cerrando.value = true
    error.value = null
    try {
      await contenedorApi.cerrar(contenedorId)
      if (contenedorActivoId.value === contenedorId) contenedorActivoId.value = null
      await cargar(grupoId, solicitudId)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo cerrar el contenedor'
      throw e
    } finally {
      cerrando.value = false
    }
  }

  return {
    trazabilidad, loading, error,
    creando, empacando, cerrando, contenedorActivoId,
    cargar, crearContenedor, empacar, cerrarContenedor,
  }
})
