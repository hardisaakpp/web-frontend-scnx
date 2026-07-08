<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <router-link
      to="/transacciones"
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Transacciones
    </router-link>

    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Reporte de Tesorería</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Consulta el historial de transacciones con filtros avanzados · rango máximo 31 días
      </p>
    </div>

    <!-- Filtros -->
    <FiltrosTesoreria
      :cargando="store.loadingTesoreria"
      :cargando-excel="store.loadingExcel"
      @consultar="consultar"
      @exportar="exportar"
    />

    <!-- Error -->
    <div
      v-if="store.errorTesoreria"
      class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400"
    >
      {{ store.errorTesoreria }}
    </div>

    <!-- Tabla resultados -->
    <div
      v-if="consultadoAlMenosUnaVez"
      class="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700"
    >
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Resultados</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ store.transaccionesTesoreria.length }} transacciones</p>
        </div>
      </div>

      <div v-if="store.loadingTesoreria" class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando reporte...
      </div>

      <div v-else-if="store.transaccionesTesoreria.length === 0" class="px-6 py-12 text-center">
        <p class="text-gray-500 dark:text-gray-400 font-medium">No hay transacciones para el período seleccionado</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tienda</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cod. Vendedor</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Referencia Transacción</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="tx in store.transaccionesTesoreria"
              :key="tx.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ tx.tienda || tx.codigoAlmacen || '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ tx.codVendedor || '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ formatFecha(tx.fechaProceso) }}</td>
              <td class="px-4 py-3 text-sm text-right font-semibold"
                :class="tx.signo === '+' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
              >
                {{ tx.signo }}{{ formatMonto(tx.valorMontoTotal) }}
              </td>
              <td class="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">{{ tx.referenciaTransaccion }}</td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ tx.cliente || tx.identificacionCliente || '—' }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="clasePorEstado(tx.estado)">
                  {{ tx.estado }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '@vue/reactivity'
import { useAuthStore } from '@/stores/auth'
import { useTransaccionesStore } from '../store/transacciones'
import { useToast } from '@/composables/useToast'
import FiltrosTesoreria from '../components/FiltrosTesoreria.vue'
import type { EstadoTransaccion, FiltrosTesoreria as TFiltrosTesoreria } from '../types'

const authStore = useAuthStore()
const store = useTransaccionesStore()
const toast = useToast()

const consultadoAlMenosUnaVez = ref(false)

const idCuenta = computed(() => {
  const id = authStore.userWarehouseAccesses?.[0]?.warehouseGroupId
  return id ? parseInt(id, 10) : 0
})

async function consultar(filtros: Omit<TFiltrosTesoreria, 'idCuenta'>) {
  if (!idCuenta.value) {
    toast.warning('Sin cuenta', 'No se encontró una cuenta asociada a tu usuario.')
    return
  }
  consultadoAlMenosUnaVez.value = true
  try {
    await store.fetchTesoreria({ ...filtros, idCuenta: idCuenta.value })
  } catch (err: any) {
    const status = err?.response?.status
    const mensaje = err?.responseData?.error || err?.response?.data?.error || err?.message || 'Error desconocido'
    if (status === 400) toast.error('Rango inválido', mensaje)
    else toast.error('Error al consultar', mensaje)
  }
}

async function exportar(filtros: Omit<TFiltrosTesoreria, 'idCuenta'>) {
  if (!idCuenta.value) {
    toast.warning('Sin cuenta', 'No se encontró una cuenta asociada a tu usuario.')
    return
  }
  try {
    await store.descargarExcel({ ...filtros, idCuenta: idCuenta.value }, `transacciones_${idCuenta.value}.xlsx`)
    toast.success('Descarga iniciada', 'El archivo Excel se está descargando.')
  } catch (err: any) {
    const mensaje = err?.responseData?.error || err?.response?.data?.error || err?.message || 'Error al exportar'
    toast.error('Error al exportar', mensaje)
  }
}

function formatMonto(valor: number): string {
  return new Intl.NumberFormat('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor)
}

function formatFecha(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PA', { dateStyle: 'short', timeStyle: 'short' })
}

function clasePorEstado(estado: EstadoTransaccion): string {
  const clases: Record<EstadoTransaccion, string> = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    RESERVADO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    PROCESADO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    DESCARTADO: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }
  return clases[estado] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
}
</script>
