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
          Referencia <span class="text-red-500">*</span>
        </label>
        <input
          v-model="referenciaFiltro"
          type="text"
          placeholder="TXN-2024-001"
          class="w-52 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          :class="!referenciaValida ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'"
          @keyup.enter="emitFiltrar"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Desc. Transferencia</label>
        <input
          v-model="descripcionTransferenciaFiltro"
          type="text"
          placeholder="Descripción adicional"
          class="w-44 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          @keyup.enter="emitFiltrar"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Referencia 2</label>
        <input
          v-model="referenciaTransaccion2Filtro"
          type="text"
          placeholder="Ref. secundaria"
          class="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          @keyup.enter="emitFiltrar"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Desc. Causal</label>
        <input
          v-model="descripcionCausalFiltro"
          type="text"
          placeholder="Causal"
          class="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          @keyup.enter="emitFiltrar"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Desc. Transacción</label>
        <input
          v-model="descripcionTransaccionFiltro"
          type="text"
          placeholder="Transacción"
          class="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          @keyup.enter="emitFiltrar"
        />
      </div>
      <button
        @click="emitFiltrar"
        :disabled="!filtrosCompletos || loading"
        class="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
      >
        <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        {{ loading ? 'Buscando...' : 'Buscar' }}
      </button>
      <button
        v-if="montoFiltro != null || referenciaFiltro || descripcionTransferenciaFiltro || referenciaTransaccion2Filtro || descripcionCausalFiltro || descripcionTransaccionFiltro"
        @click="limpiarFiltros"
        class="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        Limpiar
      </button>
    </div>

    <!-- Aviso filtros obligatorios -->
    <p v-if="!filtrosCompletos" class="text-xs text-amber-600 dark:text-amber-400">
      <span v-if="referenciaFiltro.trim().length > 0 && !referenciaValida">
        La referencia debe tener al menos 3 caracteres ({{ referenciaFiltro.trim().length }}/3).
      </span>
      <span v-else>
        Ingrese el monto y al menos 3 caracteres de referencia para buscar transacciones.
      </span>
    </p>

    <!-- Tabla -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Referencia</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Referencia 2</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Proceso</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Ingreso</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Mod.</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Causal</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transferencia</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Oficina</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Beneficiario</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Establecimiento</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cód. Reverso</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Almacén</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          <tr v-if="!filtrosCompletos">
            <td colspan="17" class="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              Complete los filtros obligatorios para ver transacciones de los últimos 20 minutos.
            </td>
          </tr>
          <tr v-else-if="loading">
            <td colspan="17" class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Buscando transacciones...
            </td>
          </tr>
          <tr v-else-if="transacciones.length === 0">
            <td colspan="17" class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No se encontraron transacciones con esos filtros.
            </td>
          </tr>
          <tr
            v-for="tx in transacciones"
            :key="tx.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <td class="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">{{ tx.referenciaTransaccion }}</td>
            <td class="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">{{ tx.referenciaTransaccion2 || '—' }}</td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ tx.tipoTransaccion || '—' }}</td>
            <td class="px-4 py-3 text-sm text-right font-semibold"
              :class="tx.signo === 'C' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
            >
              {{ tx.signo === 'C' ? '+' : '-' }}{{ formatMonto(tx.valorMontoTotal) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ formatFecha(tx.fechaProceso) }}</td>
            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ formatFecha(tx.fechaIngreso) }}</td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ tx.fechaModificacion ? formatFecha(tx.fechaModificacion) : '—' }}</td>
            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" :title="tx.descripcionTransaccion ?? ''">
              {{ tx.descripcionTransaccion || '—' }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" :title="tx.descripcionCausal ?? ''">
              {{ tx.descripcionCausal || '—' }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" :title="tx.descripcionTransferencia ?? ''">
              {{ tx.descripcionTransferencia || '—' }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" :title="tx.nombreOficina ?? ''">
              {{ tx.nombreOficina || '—' }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" :title="tx.nombreBeneficiario ?? ''">
              {{ tx.nombreBeneficiario || '—' }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" :title="tx.nombreEstablecimiento ?? ''">
              {{ tx.nombreEstablecimiento || '—' }}
            </td>
            <td class="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">{{ tx.codigoReverso || '—' }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="clasePorEstado(tx.estado)">
                {{ tx.estado }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ tx.codigoAlmacen || '—' }}</td>
            <td class="px-4 py-3 text-right">
              <button
                v-if="tx.estado === 'Pendiente'"
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
  (e: 'filtrar', monto: number | null, referencia: string | null, descripcionTransferencia: string | null, referenciaTransaccion2: string | null, descripcionCausal: string | null, descripcionTransaccion: string | null): void
}>()

const montoFiltro = ref<number | null>(null)
const referenciaFiltro = ref('')
const descripcionTransferenciaFiltro = ref('')
const referenciaTransaccion2Filtro = ref('')
const descripcionCausalFiltro = ref('')
const descripcionTransaccionFiltro = ref('')

const referenciaValida = computed(() => referenciaFiltro.value.trim().length >= 3)
const filtrosCompletos = computed(() => montoFiltro.value != null && referenciaValida.value)

function emitFiltrar() {
  if (!filtrosCompletos.value) return
  emit(
    'filtrar',
    montoFiltro.value,
    referenciaFiltro.value.trim(),
    descripcionTransferenciaFiltro.value.trim() || null,
    referenciaTransaccion2Filtro.value.trim() || null,
    descripcionCausalFiltro.value.trim() || null,
    descripcionTransaccionFiltro.value.trim() || null,
  )
}

function limpiarFiltros() {
  montoFiltro.value = null
  referenciaFiltro.value = ''
  descripcionTransferenciaFiltro.value = ''
  referenciaTransaccion2Filtro.value = ''
  descripcionCausalFiltro.value = ''
  descripcionTransaccionFiltro.value = ''
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
