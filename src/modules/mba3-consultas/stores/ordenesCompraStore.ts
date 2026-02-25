import { defineStore } from 'pinia'
import { ref, computed } from '@vue/reactivity'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { OrdenCompra } from '../types'

export const useOrdenesCompraStore = defineStore('mba3OrdenesCompra', () => {
  const ordenesCompra = ref<OrdenCompra[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const estadoFilter = ref<string | undefined>(undefined)
  const metadata = ref<any>(null)
  
  // Variables de paginación
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  
  // Estadísticas totales (para el dashboard)
  const totalPendientes = ref(0)
  const totalEnviadas = ref(0)
  const totalErrores = ref(0)

  const count = computed(() => ordenesCompra.value.length)
  
  // Usar los totales para las estadísticas del dashboard
  const pendientes = computed(() => totalPendientes.value)
  const enviadas = computed(() => totalEnviadas.value)
  const errores = computed(() => totalErrores.value)
  
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
  
  // Función para actualizar las estadísticas totales
  async function fetchEstadisticas() {
    try {
      // Obtener conteos por estado usando llamadas con paginación para obtener el total
      // Hacemos llamadas con pageSize=1 solo para obtener el metadata.total
      const [pendientesRes, enviadasRes, erroresRes] = await Promise.all([
        mba3ConsultasService.getOrdenesCompra('PENDIENTE', 1, 1).catch(() => ({ data: [], total: 0, metadata: { count: 0 } })),
        mba3ConsultasService.getOrdenesCompra('ENVIADA', 1, 1).catch(() => ({ data: [], total: 0, metadata: { count: 0 } })),
        mba3ConsultasService.getOrdenesCompra('ERROR', 1, 1).catch(() => ({ data: [], total: 0, metadata: { count: 0 } }))
      ])
      
      // Usar total si está disponible, sino usar metadata.count, sino 0
      totalPendientes.value = pendientesRes.total ?? pendientesRes.metadata?.count ?? 0
      totalEnviadas.value = enviadasRes.total ?? enviadasRes.metadata?.count ?? 0
      totalErrores.value = erroresRes.total ?? erroresRes.metadata?.count ?? 0
    } catch (err) {
      console.error('Error fetching estadisticas:', err)
    }
  }

  async function fetchOrdenesCompra(estado?: string, page: number = 1) {
    loading.value = true
    error.value = null
    estadoFilter.value = estado
    currentPage.value = page
    try {
      const response = await mba3ConsultasService.getOrdenesCompra(estado, page, pageSize.value)
      ordenesCompra.value = response.data
      metadata.value = response.metadata
      
      // Actualizar información de paginación si viene en la respuesta
      if (response.total !== undefined) {
        total.value = response.total
      } else if (response.metadata?.count !== undefined) {
        total.value = response.metadata.count
      } else {
        // Si no viene total, usar el count de los datos actuales
        total.value = response.data.length
      }
    } catch (err: any) {
      error.value = err.message || 'Error al obtener órdenes de compra'
      console.error('Error fetching ordenes compra:', err)
    } finally {
      loading.value = false
    }
  }
  
  function setPage(page: number) {
    currentPage.value = page
  }

  async function integrarSAP(referenciaDespacho?: string | string[]) {
    loading.value = true
    error.value = null
    try {
      const response = await mba3ConsultasService.integrarSAP(referenciaDespacho)
      // Refrescar la lista después de integrar
      await fetchOrdenesCompra(estadoFilter.value, currentPage.value)
      return response
    } catch (err: any) {
      error.value = err.message || 'Error al integrar con SAP'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    ordenesCompra,
    loading,
    error,
    estadoFilter,
    metadata,
    count,
    pendientes,
    enviadas,
    errores,
    total,
    currentPage,
    pageSize,
    totalPages,
    fetchOrdenesCompra,
    integrarSAP,
    setPage,
    fetchEstadisticas,
  }
})

