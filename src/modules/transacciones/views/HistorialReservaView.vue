<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <router-link
      to="/transacciones"
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Transacciones
    </router-link>

    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Historial de Reservas</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Consulta el historial de reservas realizadas · rango máximo 31 días
      </p>
    </div>

    <!-- Filtros -->
    <FiltrosTesoreria
      :cargando="store.loadingHistorial"
      :cargando-excel="false"
      :mostrar-exportar="false"
      :cuentas="store.cuentas"
      :loading-cuentas="store.loadingCuentas"
      estado-fijo="Reservado"
      @consultar="consultar"
      @exportar="() => {}"
    />

    <!-- Error -->
    <div
      v-if="store.errorHistorial"
      class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400"
    >
      {{ store.errorHistorial }}
    </div>

    <!-- Tabla resultados -->
    <div
      v-if="consultadoAlMenosUnaVez"
      class="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700"
    >
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Resultados</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ store.transaccionesHistorial.length }} transacciones</p>
        </div>
      </div>

      <div v-if="store.loadingHistorial" class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando historial...
      </div>

      <div v-else-if="store.transaccionesHistorial.length === 0" class="px-6 py-12 text-center">
        <p class="text-gray-500 dark:text-gray-400 font-medium">No hay reservas para el período seleccionado</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tienda</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendedor</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Banco</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Reserva</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Ingreso</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Referencia</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="tx in store.transaccionesHistorial"
              :key="tx.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ tx.nombreAlmacen || tx.codigoAlmacen || '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ tx.codVendedor || '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ tx.usuarioReserva || '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ formatFecha(tx.fechaProceso) }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ tx.fechaReserva ? formatFecha(tx.fechaReserva) : '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ formatFecha(tx.fechaIngreso) }}</td>
              <td class="px-4 py-3 text-sm text-right font-semibold"
                :class="tx.signo === 'C' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
              >
                {{ tx.signo === 'C' ? '+' : '-' }}{{ formatMonto(tx.valorMontoTotal) }}
              </td>
              <td class="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">{{ tx.referenciaTransaccion }}</td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ tx.nombreBeneficiario || '—' }}</td>
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
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTransaccionesStore } from '../store/transacciones'
import { useToast } from '@/composables/useToast'
import FiltrosTesoreria from '../components/FiltrosTesoreria.vue'
import type { EstadoTransaccion, FiltrosTesoreria as TFiltrosTesoreria } from '../types'

const authStore = useAuthStore()
const store = useTransaccionesStore()
const toast = useToast()

const consultadoAlMenosUnaVez = ref(false)

const codAlmacen = computed(() => authStore.userWarehouseAccesses?.[0]?.codAlmacen ?? null)

onMounted(() => store.fetchCuentasCajero())

async function consultar(filtros: TFiltrosTesoreria) {
  consultadoAlMenosUnaVez.value = true
  try {
    await store.fetchHistorial({ ...filtros, codigoAlmacen: codAlmacen.value })
  } catch (err: any) {
    const status = err?.response?.status
    const mensaje = err?.response?.data?.error || err?.message || 'Error desconocido'
    if (status === 400) toast.error('Rango inválido', mensaje)
    else toast.error('Error al consultar', mensaje)
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
    Pendiente:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    Reservado:  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Procesado:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Descartado: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }
  return clases[estado] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
}
</script>
