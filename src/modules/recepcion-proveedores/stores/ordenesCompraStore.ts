import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ordenesCompraApi } from '../services/ordenesCompraApi'
import { mapApiError } from '@/utils/apiErrorMapper'
import type { EntradaMercaderiaResponse, OrdenCompraResponse } from '../types'

export const useOrdenesCompraStore = defineStore('recepcionProveedoresOrdenesCompra', () => {
  const orden = ref<OrdenCompraResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const entradas = ref<EntradaMercaderiaResponse[]>([])
  const cargandoEntradas = ref(false)
  const errorEntradas = ref<string | null>(null)

  async function buscarPorDocNum(docNum: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      orden.value = await ordenesCompraApi.buscarPorDocNum(docNum)
    } catch (err: unknown) {
      orden.value = null
      error.value = mapApiError(err, 'No se pudo buscar la orden de compra.').message
    } finally {
      loading.value = false
    }
  }

  async function actualizarDesdeSap(docNum: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      orden.value = await ordenesCompraApi.actualizarDesdeSap(docNum)
    } catch (err: unknown) {
      error.value = mapApiError(err, 'No se pudo actualizar la orden de compra desde SAP.').message
    } finally {
      loading.value = false
    }
  }

  async function cargarEntradasRelacionadas(docNum: number): Promise<void> {
    cargandoEntradas.value = true
    errorEntradas.value = null
    try {
      entradas.value = await ordenesCompraApi.obtenerEntradasRelacionadas(docNum)
    } catch (err: unknown) {
      entradas.value = []
      errorEntradas.value = mapApiError(err, 'No se pudieron cargar las entradas de mercadería relacionadas.').message
    } finally {
      cargandoEntradas.value = false
    }
  }

  return {
    orden,
    loading,
    error,
    entradas,
    cargandoEntradas,
    errorEntradas,
    buscarPorDocNum,
    actualizarDesdeSap,
    cargarEntradasRelacionadas,
  }
})
