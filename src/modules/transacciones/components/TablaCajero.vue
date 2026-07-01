<template>
  <div class="space-y-4">
    <!-- Filtros -->
    <div class="flex flex-wrap gap-3 items-end">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">
          Monto <span class="text-red-500">*</span>
        </label>
        <input
          v-model.number="montoFiltro"
          type="number"
          step="0.01"
          min="0"
          placeholder="Ej: 250.00"
          class="w-36 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          :class="montoFiltro == null ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'"
          @keyup.enter="emitFiltrar"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">
          Referencia Transacción <span class="text-red-500">*</span>
        </label>
        <input
          v-model="referenciaFiltro"
          type="text"
          placeholder="TXN-2024-001"
          class="w-52 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          :class="!referenciaFiltro ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'"
          @keyup.enter="emitFiltrar"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Identificación Cliente</label>
        <input
          v-model="identificacionFiltro"
          type="text"
          placeholder="Cédula o RUC"
          class="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          @keyup.enter="emitFiltrar"
        />
      </div>
      <button
        @click="emitFiltrar"
        :disabled="!filtrosCompletos || loading"
        class="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Buscar
      </button>
      <button
        v-if="montoFiltro != null || referenciaFiltro || identificacionFiltro"
        @click="limpiarFiltros"
        class="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        Limpiar
      </button>
    </div>

    <!-- Aviso filtros obligatorios -->
    <p v-if="!filtrosCompletos" class="text-xs text-amber-600 dark:text-amber-400">
      Ingrese el monto y la referencia de transacción para buscar.
    </p>

    <!-- Tabla -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Referencia</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Proceso</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          <tr v-if="!filtrosCompletos">
            <td colspan="8" class="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              Complete los filtros obligatorios para ver transacciones de los últimos 20 minutos.
            </td>
          </tr>
          <tr v-else-if="loading">
            <td colspan="8" class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Buscando transacciones...
            </td>
          </tr>
          <tr v-else-if="transacciones.length === 0">
            <td colspan="8" class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No se encontraron transacciones con esos filtros.
            </td>
          </tr>
          <tr
            v-for="tx in transacciones"
            :key="tx.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <td class="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">{{ tx.referenciaTransaccion }}</td>
            <td class="px-4 py-3 text-sm text-right font-semibold"
              :class="tx.signo === '+' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
            >
              {{ tx.signo }}{{ formatMonto(tx.valorMontoTotal) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ formatFecha(tx.fechaProceso) }}</td>
            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ tx.tipoTransaccion }}</td>
            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" :title="tx.descripcionTransaccion">
              {{ tx.descripcionTransaccion }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ tx.identificacionCliente || '—' }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="clasePorEstado(tx.estado)">
                {{ tx.estado }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                v-if="tx.estado === 'PENDIENTE'"
                @click="$emit('reservar', tx)"
                :disabled="reservando"
                class="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reservar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '@vue/reactivity'
import type { Transaccion, EstadoTransaccion } from '../types'

defineProps<{ transacciones: Transaccion[]; loading: boolean; reservando: boolean }>()

const emit = defineEmits<{
  (e: 'reservar', tx: Transaccion): void
  (e: 'filtrar', monto: number | null, referencia: string | null, identificacionCliente: string | null): void
}>()

const montoFiltro = ref<number | null>(null)
const referenciaFiltro = ref('')
const identificacionFiltro = ref('')

const filtrosCompletos = computed(() => montoFiltro.value != null && !!referenciaFiltro.value.trim())

function emitFiltrar() {
  if (!filtrosCompletos.value) return
  emit('filtrar', montoFiltro.value, referenciaFiltro.value.trim(), identificacionFiltro.value.trim() || null)
}

function limpiarFiltros() {
  montoFiltro.value = null
  referenciaFiltro.value = ''
  identificacionFiltro.value = ''
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
