<script setup lang="ts">
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import CargandoSpinner from './CargandoSpinner.vue'
import type { ErrorSap } from '../types'

defineProps<{ abierto: boolean; errores: ErrorSap[]; cargando: boolean }>()
const emit = defineEmits<{ cerrar: [] }>()

const formatFechaHora = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('cerrar')"></div>

    <div class="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <ExclamationTriangleIcon class="w-5 h-5 text-rose-500" />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Errores de envío a SAP</h2>
        </div>
        <button type="button" @click="emit('cerrar')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <div class="overflow-y-auto p-6">
        <CargandoSpinner v-if="cargando" mensaje="Cargando errores…" />

        <div v-else-if="errores.length === 0" class="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
          No hay detalles de error registrados.
        </div>

        <div v-else class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Fecha</th>
                  <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Operación</th>
                  <th class="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mensaje</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                <tr v-for="(e, i) in errores" :key="i">
                  <td class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ formatFechaHora(e.fecha) }}</td>
                  <td class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{{ e.operacion }}</td>
                  <td class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{{ e.mensaje }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
