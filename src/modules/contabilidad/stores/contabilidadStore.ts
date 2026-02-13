import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Transaccion, Balance, ContabilidadState } from '../types'
import { contabilidadService } from '../services/contabilidadApi'

export const useContabilidadStore = defineStore('contabilidad', () => {
  // State
  const transacciones = ref<Transaccion[]>([])
  const balance = ref<Balance>({
    ingresos: 0,
    egresos: 0,
    balance: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const ingresosTotal = computed(() => 
    transacciones.value
      .filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + t.monto, 0)
  )

  const egresosTotal = computed(() => 
    transacciones.value
      .filter(t => t.tipo === 'egreso')
      .reduce((sum, t) => sum + t.monto, 0)
  )

  const balanceTotal = computed(() => ingresosTotal.value - egresosTotal.value)

  const transaccionesPendientes = computed(() => 
    transacciones.value.filter(t => t.estado === 'pendiente')
  )

  // Actions
  async function fetchTransacciones() {
    loading.value = true
    error.value = null
    try {
      transacciones.value = await contabilidadService.getTransacciones()
    } catch (e: any) {
      error.value = e.message || 'Error al cargar transacciones'
      console.error('Error fetching transacciones:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchBalance() {
    try {
      balance.value = await contabilidadService.getBalance()
    } catch (e: any) {
      error.value = e.message || 'Error al cargar balance'
      console.error('Error fetching balance:', e)
    }
  }

  async function createTransaccion(data: Omit<Transaccion, 'id'>) {
    loading.value = true
    error.value = null
    try {
      const newTransaccion = await contabilidadService.createTransaccion(data)
      transacciones.value.unshift(newTransaccion)
      await fetchBalance()
      return newTransaccion
    } catch (e: any) {
      error.value = e.message || 'Error al crear transacción'
      console.error('Error creating transaccion:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateTransaccion(id: number, data: Partial<Transaccion>) {
    loading.value = true
    error.value = null
    try {
      const updated = await contabilidadService.updateTransaccion(id, data)
      const index = transacciones.value.findIndex(t => t.id === id)
      if (index !== -1) {
        transacciones.value[index] = updated
      }
      await fetchBalance()
      return updated
    } catch (e: any) {
      error.value = e.message || 'Error al actualizar transacción'
      console.error('Error updating transaccion:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteTransaccion(id: number) {
    loading.value = true
    error.value = null
    try {
      await contabilidadService.deleteTransaccion(id)
      transacciones.value = transacciones.value.filter(t => t.id !== id)
      await fetchBalance()
    } catch (e: any) {
      error.value = e.message || 'Error al eliminar transacción'
      console.error('Error deleting transaccion:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    transacciones,
    balance,
    loading,
    error,
    // Getters
    ingresosTotal,
    egresosTotal,
    balanceTotal,
    transaccionesPendientes,
    // Actions
    fetchTransacciones,
    fetchBalance,
    createTransaccion,
    updateTransaccion,
    deleteTransaccion,
    clearError
  }
})
