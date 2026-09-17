<template>
  <table class="w-full text-left border-separate border-spacing-0 table-auto min-w-full">
    <thead>
      <tr class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <th class="sticky top-0 z-10 px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 rounded-tl-xl">Archivo</th>
        <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Banco</th>
        <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Estado</th>
        <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Registros</th>
        <th class="sticky top-0 z-10 px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 rounded-tr-xl">Fecha</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
      <template v-for="carga in cargas" :key="carga.id_carga">
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <td class="px-4 py-3">
            <span class="text-sm font-semibold text-gray-900 dark:text-white truncate block max-w-[220px]" :title="carga.nombre_archivo">{{ carga.nombre_archivo }}</span>
          </td>
          <td class="px-2 py-3 text-center">
            <span class="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">{{ carga.tipo_origen }}</span>
          </td>
          <td class="px-2 py-3 text-center">
            <button
              v-if="carga.observaciones"
              @click="toggleObservacion(carga.id_carga)"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold hover:underline"
              :class="estadoBadgeClass(carga.estado_carga)"
            >
              {{ carga.estado_carga }}
              <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': cargaExpandidaId === carga.id_carga }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <span v-else class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold" :class="estadoBadgeClass(carga.estado_carga)">
              {{ carga.estado_carga }}
            </span>
          </td>
          <td class="px-2 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-300 font-mono">{{ carga.registros_procesados }}</td>
          <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{{ formatFechaCarga(carga.fecha_carga) }}</td>
        </tr>
        <tr v-if="cargaExpandidaId === carga.id_carga" class="bg-gray-50 dark:bg-gray-900/40">
          <td colspan="5" class="px-4 py-3">
            <ul class="list-disc list-inside space-y-1 text-xs text-gray-600 dark:text-gray-300">
              <li v-for="(linea, idx) in parseObservaciones(carga.observaciones)" :key="idx">{{ linea }}</li>
            </ul>
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { estadoBadgeClass, parseObservaciones, formatFechaCarga } from '../utils/cargas'
import type { CargaArchivo } from '../types'

defineProps<{
  cargas: CargaArchivo[]
}>()

const cargaExpandidaId = ref<number | null>(null)

function toggleObservacion(idCarga: number) {
  cargaExpandidaId.value = cargaExpandidaId.value === idCarga ? null : idCarga
}
</script>
