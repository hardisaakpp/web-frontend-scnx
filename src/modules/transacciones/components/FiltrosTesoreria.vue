<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
    <div class="flex flex-wrap gap-4 items-end">
      <!-- Desde -->
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Desde <span class="text-red-500">*</span></label>
        <input
          v-model="desdeLocal"
          type="datetime-local"
          :max="hastaLocal"
          class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      <!-- Hasta -->
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Hasta <span class="text-red-500">*</span></label>
        <input
          v-model="hastaLocal"
          type="datetime-local"
          :min="desdeLocal"
          class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      <!-- Código Almacén -->
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Almacén</label>
        <input
          v-model="codigoAlmacenLocal"
          type="text"
          placeholder="ALM-NORTE"
          class="w-36 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      <!-- Estado -->
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Estado</label>
        <select
          v-model="estadoLocal"
          class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="">Todos</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="RESERVADO">Reservado</option>
          <option value="PROCESADO">Procesado</option>
          <option value="DESCARTADO">Descartado</option>
        </select>
      </div>

      <!-- Botones -->
      <div class="flex gap-2">
        <button
          @click="emitConsultar"
          :disabled="!desdeLocal || !hastaLocal || !!errorRango || cargando"
          class="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <svg v-if="cargando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Consultar
        </button>
        <button
          @click="emitExportar"
          :disabled="!desdeLocal || !hastaLocal || !!errorRango || cargandoExcel"
          class="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <svg v-if="cargandoExcel" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Excel
        </button>
      </div>
    </div>

    <p v-if="errorRango" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ errorRango }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '@vue/reactivity'
import type { EstadoTransaccion, FiltrosTesoreria } from '../types'

defineProps<{ cargando: boolean; cargandoExcel: boolean }>()

const emit = defineEmits<{
  (e: 'consultar', filtros: Omit<FiltrosTesoreria, 'idCuenta'>): void
  (e: 'exportar', filtros: Omit<FiltrosTesoreria, 'idCuenta'>): void
}>()

const TREINTA_UN_DIAS_MS = 31 * 24 * 60 * 60 * 1000

const ahora = new Date()
const haceSieteDias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)

function toDatetimeLocal(d: Date): string {
  return d.toISOString().slice(0, 16)
}

const desdeLocal = ref(toDatetimeLocal(haceSieteDias))
const hastaLocal = ref(toDatetimeLocal(ahora))
const codigoAlmacenLocal = ref('')
const estadoLocal = ref<EstadoTransaccion | ''>('')

const errorRango = computed(() => {
  if (!desdeLocal.value || !hastaLocal.value) return ''
  const diff = new Date(hastaLocal.value).getTime() - new Date(desdeLocal.value).getTime()
  if (diff < 0) return 'La fecha "Hasta" debe ser posterior a "Desde".'
  if (diff > TREINTA_UN_DIAS_MS) return 'El rango máximo permitido es de 31 días.'
  return ''
})

function buildFiltros(): Omit<FiltrosTesoreria, 'idCuenta'> {
  return {
    desde: new Date(desdeLocal.value).toISOString(),
    hasta: new Date(hastaLocal.value).toISOString(),
    codigoAlmacen: codigoAlmacenLocal.value || null,
    estado: (estadoLocal.value as EstadoTransaccion) || null,
  }
}

function emitConsultar() {
  if (errorRango.value) return
  emit('consultar', buildFiltros())
}

function emitExportar() {
  if (errorRango.value) return
  emit('exportar', buildFiltros())
}
</script>
